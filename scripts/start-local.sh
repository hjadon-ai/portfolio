#!/usr/bin/env bash
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE="${1:-}"

if [ "$PROFILE" != "dev" ] && [ "$PROFILE" != "stage" ]; then
  echo "Usage: ./scripts/start-local.sh dev|stage" >&2
  exit 1
fi

ENV_FILE="$ROOT_DIR/server/.env.$PROFILE"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing server/.env.$PROFILE. Copy server/.env.$PROFILE.example and add this profile's credentials." >&2
  exit 1
fi

if [ ! -d "$ROOT_DIR/server/node_modules" ] || [ ! -d "$ROOT_DIR/web/node_modules" ]; then
  echo "Install dependencies in server/ and web/ before starting Astitva." >&2
  exit 1
fi

for PORT_TO_CHECK in 3000 3001; do
  if lsof -nP -iTCP:"$PORT_TO_CHECK" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $PORT_TO_CHECK is already in use. Stop the running Astitva profile first." >&2
    exit 1
  fi
done

chmod 600 "$ENV_FILE"

cleanup() {
  trap - INT TERM EXIT
  [ -z "${SERVER_PID:-}" ] || kill "$SERVER_PID" 2>/dev/null || true
  [ -z "${WEB_PID:-}" ] || kill "$WEB_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Starting Astitva $PROFILE locally..."
(cd "$ROOT_DIR/server" && node --env-file="$ENV_FILE" src/server.js) &
SERVER_PID=$!
(cd "$ROOT_DIR/web" && npm run dev) &
WEB_PID=$!

while kill -0 "$SERVER_PID" 2>/dev/null && kill -0 "$WEB_PID" 2>/dev/null; do
  sleep 1
done

STATUS=0
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  wait "$SERVER_PID" 2>/dev/null || STATUS=$?
else
  wait "$WEB_PID" 2>/dev/null || STATUS=$?
fi
exit "$STATUS"
