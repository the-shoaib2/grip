#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${GRIP_CHROME_PORT:-9222}"
EXT_DIR="$ROOT/packages/extension/dist"
OPEN_URL="${1:-http://localhost:5174/}"

echo "Building @grip/extension..."
pnpm --dir "$ROOT" build --filter @grip/extension

echo ""
echo "Starting Chrome (port $PORT) with Grip loaded from:"
echo "  $EXT_DIR"
echo ""
echo "After code changes: rebuild, then reload Grip on chrome://extensions"
echo ""

exec "$ROOT/scripts/launch-chrome.sh" "$PORT" \
  --load-extension="$EXT_DIR" \
  "$OPEN_URL"
