#!/bin/bash
# M1 smoke test: start -> health -> submit -> report -> stop

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-18888}"
TOKEN="${API_TOKEN:-m1-smoke-token}"
DATE="${DATE:-$(date +%F)}"

cleanup() {
  bash "$ROOT_DIR/deploy/stop.sh" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[smoke] starting service..."
REQUIRE_API_AUTH=1 API_TOKEN="$TOKEN" PORT="$PORT" EXPOSE_MODE=local \
  bash "$ROOT_DIR/deploy/start.sh" >/tmp/daily-m1-smoke-start.log

echo "[smoke] health check..."
curl -fsS "http://127.0.0.1:$PORT/health" | rg '"status":"ok"' >/dev/null

echo "[smoke] unauthorized check..."
UNAUTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://127.0.0.1:$PORT/api/submit" \
  -H 'Content-Type: application/json' \
  -d "{\"date\":\"$DATE\",\"timeline\":[]}")"
if [ "$UNAUTH_CODE" != "401" ]; then
  echo "[smoke] expected 401, got $UNAUTH_CODE"
  exit 1
fi

echo "[smoke] submit..."
curl -fsS -X POST "http://127.0.0.1:$PORT/api/submit" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"date\":\"$DATE\",
    \"timeline\":[
      {\"time\":\"09:00\",\"text\":\"工作\"},
      {\"time\":\"10:00\",\"text\":\"开会\"}
    ],
    \"mood\":\"mid\"
  }" >/dev/null

echo "[smoke] report..."
curl -fsS "http://127.0.0.1:$PORT/api/report/$DATE" \
  -H "Authorization: Bearer $TOKEN" | rg '"date"' >/dev/null

echo "[smoke] status..."
bash "$ROOT_DIR/deploy/status.sh"

echo "[smoke] PASS"
