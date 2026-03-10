#!/bin/bash
# daily-system 状态脚本

set -euo pipefail

RUN_DIR="${RUN_DIR:-/tmp/daily-system}"
PID_FILE="$RUN_DIR/pids"
RUNTIME_FILE="$RUN_DIR/runtime.env"

if [ ! -f "$PID_FILE" ]; then
  echo "status: stopped"
  exit 0
fi

read -r SERVER_PID TUNNEL_PID PORT < "$PID_FILE" || true
SERVER_STATE="stopped"
TUNNEL_STATE="stopped"

if [[ "${SERVER_PID:-}" =~ ^[0-9]+$ ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
  SERVER_STATE="running"
fi
if [[ "${TUNNEL_PID:-}" =~ ^[0-9]+$ ]] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
  TUNNEL_STATE="running"
fi

echo "status: running"
echo "port: ${PORT:--}"
echo "server_pid: ${SERVER_PID:--} ($SERVER_STATE)"
echo "tunnel_pid: ${TUNNEL_PID:--} ($TUNNEL_STATE)"

if [ -f "$RUNTIME_FILE" ]; then
  # shellcheck disable=SC1090
  source "$RUNTIME_FILE"
  echo "mode: ${EXPOSE_MODE:-unknown}"
  echo "url: ${URL:--}"
  echo "local_url: ${LOCAL_URL:--}"
  echo "log: ${LOG_FILE:--}"
  if [ -n "${TUNNEL_LOG:-}" ]; then
    echo "tunnel_log: ${TUNNEL_LOG}"
  fi
  if [ "${REQUIRE_API_AUTH:-0}" = "1" ]; then
    echo "api_auth: enabled"
  else
    echo "api_auth: disabled"
  fi
fi
