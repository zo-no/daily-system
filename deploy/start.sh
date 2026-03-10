#!/bin/bash
# daily-system 启动脚本（local-first）
# 用法：
#   bash deploy/start.sh
#   EXPOSE_MODE=tunnel bash deploy/start.sh
# 可选环境变量：
#   PORT=8888
#   DATA_DIR=./data
#   PUBLIC_DIR=./web
#   REQUIRE_API_AUTH=0|1
#   API_TOKEN=<token>

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="${RUN_DIR:-/tmp/daily-system}"
PORT="${PORT:-8888}"
EXPOSE_MODE="${EXPOSE_MODE:-local}"
DATA_DIR="${DATA_DIR:-./data}"
PUBLIC_DIR="${PUBLIC_DIR:-./web}"
LOG_FILE="$RUN_DIR/server.log"
TUNNEL_LOG="$RUN_DIR/tunnel.log"
PID_FILE="$RUN_DIR/pids"
RUNTIME_FILE="$RUN_DIR/runtime.env"

mkdir -p "$RUN_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js 未安装"
  exit 1
fi

if [ "$EXPOSE_MODE" != "local" ] && [ "$EXPOSE_MODE" != "tunnel" ]; then
  echo "❌ EXPOSE_MODE 只能是 local 或 tunnel"
  exit 1
fi

# 若已有进程则先停止
if [ -f "$PID_FILE" ]; then
  bash "$ROOT_DIR/deploy/stop.sh" >/dev/null 2>&1 || true
fi

if [ "${REQUIRE_API_AUTH:-}" = "1" ] && [ -z "${API_TOKEN:-}" ]; then
  API_TOKEN="$(openssl rand -hex 16)"
fi

echo "🚀 启动 daily-system ..."

(
  cd "$ROOT_DIR"
  PORT="$PORT" \
  DATA_DIR="$DATA_DIR" \
  PUBLIC_DIR="$PUBLIC_DIR" \
  REQUIRE_API_AUTH="${REQUIRE_API_AUTH:-0}" \
  API_TOKEN="${API_TOKEN:-}" \
  node server/server.js >"$LOG_FILE" 2>&1
) &
SERVER_PID=$!

# 等待健康检查
for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

if ! curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
  echo "❌ 服务器启动失败，日志：$LOG_FILE"
  tail -n 20 "$LOG_FILE" 2>/dev/null || true
  kill "$SERVER_PID" 2>/dev/null || true
  exit 1
fi

LOCAL_URL="http://127.0.0.1:$PORT"
URL="$LOCAL_URL"
TUNNEL_PID="-"

if [ "$EXPOSE_MODE" = "tunnel" ]; then
  if ! command -v cloudflared >/dev/null 2>&1; then
    echo "❌ tunnel 模式需要 cloudflared，请先安装（例如：brew install cloudflared）"
    kill "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi
  : > "$TUNNEL_LOG"
  cloudflared tunnel --url "$LOCAL_URL" >"$TUNNEL_LOG" 2>&1 &
  TUNNEL_PID=$!

  for _ in $(seq 1 30); do
    URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -n 1 || true)"
    [ -n "$URL" ] && break
    sleep 1
  done

  if [ -z "$URL" ]; then
    echo "❌ 外网隧道建立失败，日志：$TUNNEL_LOG"
    kill "$SERVER_PID" "$TUNNEL_PID" 2>/dev/null || true
    exit 1
  fi
fi

echo "$SERVER_PID $TUNNEL_PID $PORT" > "$PID_FILE"
cat > "$RUNTIME_FILE" <<EOF
ROOT_DIR=$ROOT_DIR
RUN_DIR=$RUN_DIR
PORT=$PORT
EXPOSE_MODE=$EXPOSE_MODE
LOCAL_URL=$LOCAL_URL
URL=$URL
LOG_FILE=$LOG_FILE
TUNNEL_LOG=$TUNNEL_LOG
PID_FILE=$PID_FILE
DATA_DIR=$DATA_DIR
PUBLIC_DIR=$PUBLIC_DIR
REQUIRE_API_AUTH=${REQUIRE_API_AUTH:-0}
API_TOKEN=${API_TOKEN:-}
EOF

echo ""
echo "✅ 启动完成"
echo "MODE: $EXPOSE_MODE"
echo "本地地址: $LOCAL_URL"
echo "访问地址: $URL"
if [ "${REQUIRE_API_AUTH:-0}" = "1" ]; then
  echo "API 鉴权: enabled"
  echo "API_TOKEN: ${API_TOKEN:-}"
fi
echo "日志: $LOG_FILE"
if [ "$EXPOSE_MODE" = "tunnel" ]; then
  echo "隧道日志: $TUNNEL_LOG"
fi
echo "停止: bash deploy/stop.sh"
echo "状态: bash deploy/status.sh"
