#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/scripts/ensure-go.sh"

if command -v go >/dev/null 2>&1; then
  GO=go
else
  GO="$ROOT/.tools/go/bin/go"
fi

mkdir -p "$ROOT/bin"
cd "$ROOT/packages/mcp-server"
"$GO" build -o "$ROOT/bin/grip-mcp" ./cmd/grip-mcp
echo "built: $ROOT/bin/grip-mcp"
