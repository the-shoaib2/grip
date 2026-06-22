#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-9222}"
shift || true
USER_DATA_DIR="${TMPDIR:-/tmp}/grip-chrome-${PORT}"

mkdir -p "$USER_DATA_DIR"

if command -v google-chrome >/dev/null 2>&1; then
  CHROME=google-chrome
elif command -v google-chrome-stable >/dev/null 2>&1; then
  CHROME=google-chrome-stable
elif command -v chromium >/dev/null 2>&1; then
  CHROME=chromium
elif command -v chromium-browser >/dev/null 2>&1; then
  CHROME=chromium-browser
else
  echo "Chrome/Chromium not found. Install Chrome and retry." >&2
  exit 1
fi

echo "Launching $CHROME with remote debugging on port $PORT"
echo "User data dir: $USER_DATA_DIR"

exec "$CHROME" \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "$@"
