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
elif [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [[ -x "/Applications/Chromium.app/Contents/MacOS/Chromium" ]]; then
  CHROME="/Applications/Chromium.app/Contents/MacOS/Chromium"
else
  echo "Chrome/Chromium not found. Install Chrome and retry." >&2
  exit 1
fi

echo "Launching $CHROME with remote debugging on port $PORT"
echo "User data dir: $USER_DATA_DIR"

# adw-gtk3-* themes on some Linux distros ship without gtk-4 assets; Chrome then
# spams Gtk theme parser errors. Use a complete theme unless overridden.
if [[ -z "${GTK_THEME:-}" ]]; then
  if [[ -d /usr/share/themes/Adwaita-dark ]]; then
    export GTK_THEME="Adwaita-dark"
  elif [[ -d /usr/share/themes/Adwaita ]]; then
    export GTK_THEME="Adwaita"
  fi
fi

exec "$CHROME" \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "$@"
