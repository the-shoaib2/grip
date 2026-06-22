#!/usr/bin/env bash
# Bootstrap a local Go toolchain when go is not on PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GO_VERSION="${GRIP_GO_VERSION:-1.23.0}"
GO_ROOT="$ROOT/.tools/go"
GO_BIN="$GO_ROOT/bin/go"

if command -v go >/dev/null 2>&1; then
  echo "go: $(command -v go) ($(go version))"
  exit 0
fi

if [[ -x "$GO_BIN" ]]; then
  echo "go: $GO_BIN ($("$GO_BIN" version))"
  exit 0
fi

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

TARBALL="go${GO_VERSION}.${OS}-${ARCH}.tar.gz"
URL="https://go.dev/dl/${TARBALL}"
CACHE="$ROOT/.tools/${TARBALL}"

echo "Go not found — downloading ${GO_VERSION} to .tools/go (~70MB, may take a minute)..."
mkdir -p "$ROOT/.tools"

if [[ ! -f "$CACHE" ]]; then
  curl -fL -# -o "$CACHE" "$URL"
fi

tar -C "$ROOT/.tools" -xzf "$CACHE"
echo "Go installed: $GO_BIN ($("$GO_BIN" version))"
