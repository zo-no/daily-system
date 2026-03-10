#!/bin/bash
# daily-system 停止脚本

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="${RUN_DIR:-/tmp/daily-system}"
PID_FILE="$RUN_DIR/pids"
RUNTIME_FILE="$RUN_DIR/runtime.env"

if [ ! -f "$PID_FILE" ]; then
  echo "ℹ️ 未发现运行中的 daily-system"
  exit 0
fi

read -r SERVER_PID TUNNEL_PID PORT < "$PID_FILE" || true

if [[ "${SERVER_PID:-}" =~ ^[0-9]+$ ]]; then
  kill "$SERVER_PID" 2>/dev/null || true
fi
if [[ "${TUNNEL_PID:-}" =~ ^[0-9]+$ ]]; then
  kill "$TUNNEL_PID" 2>/dev/null || true
fi

rm -f "$PID_FILE"
rm -f "$RUNTIME_FILE"

echo "✅ 已停止 daily-system (port: ${PORT:--})"
