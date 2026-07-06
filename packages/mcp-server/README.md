# grip-mcp

Go MCP server for Grip. Built with [chromedp](https://github.com/chromedp/chromedp) and the [MCP Go SDK](https://github.com/modelcontextprotocol/go-sdk).

Full architecture (client + server, extension bridge, gaps): [docs/MCP.md](../../docs/MCP.md).

## Build

```bash
go build -o ../../bin/grip-mcp ./cmd/grip-mcp
```

Or from repo root: `pnpm run build:mcp`

## Tools

Registered in [`internal/tools/register.go`](internal/tools/register.go) — mirrored in `grip-dev/mcp` as `GRIP_MCP_TOOLS`:

- `snapshot`, `highlight`, `click`, `fill`
- `read_logs`, `read_network`, `screenshot`, `pick_element`
- `navigate`, `eval`

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `GRIP_CHROME_PORT` | `9222` | Chrome remote debugging port |
| `GRIP_LOG_LEVEL` | `info` | Server log level |

CLI: `grip-mcp --port 9222` (also sets CDP port; env var is read at session connect).

## MCP client setup

TypeScript helpers for IDE config JSON live in the published npm package:

```ts
import { createCursorGripMcpConfig } from "grip-dev/mcp";
```

See [packages/core/README.md](../core/README.md).
