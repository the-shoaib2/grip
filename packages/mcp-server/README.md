# grip-mcp

Go MCP server for Grip. Built with [chromedp](https://github.com/chromedp/chromedp) and the [MCP Go SDK](https://github.com/modelcontextprotocol/go-sdk).

## Build

```bash
go build -o ../../bin/grip-mcp ./cmd/grip-mcp
```

Or from repo root: `pnpm run build:mcp`

## Tools

Implemented in [`internal/server/server.go`](internal/server/server.go):

- `snapshot`, `highlight`, `click`, `fill`
- `read_logs`, `read_network`, `screenshot`, `pick_element`
- `navigate`, `eval`

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `GRIP_CHROME_PORT` | `9222` | Chrome remote debugging port |
| `GRIP_LOG_LEVEL` | `info` | Server log level |
