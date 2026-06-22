# Grip

**Grab anything on the web.**

Grip is a Turborepo monorepo shipping three products:

| Package | Description |
|---------|-------------|
| [`@grip/core`](packages/core) | Zero-dep selector + a11y snapshot library (`@medv/finder`) |
| [`@grip/extension`](packages/extension) | Chrome MV3 extension — picker, DevTools panel, log injector |
| [`grip-mcp`](packages/mcp-server) | Go MCP server — browser automation for AI agents |

Docs site: [`apps/docs`](apps/docs)

## Quick start

```bash
pnpm install
pnpm turbo build
pnpm run build:mcp   # Go binary → bin/grip-mcp
```

### Chrome + MCP

```bash
./scripts/launch-chrome.sh 9222
pnpm run build:mcp
```

Cursor MCP config is in [`.cursor/mcp.json`](.cursor/mcp.json).

### Extension dev

```bash
pnpm turbo dev --filter=@grip/extension
```

Load `packages/extension/dist` as an unpacked extension in Chrome.

### Docs dev

```bash
pnpm turbo dev --filter=@grip/docs
```

## Monorepo layout

```
grip/
├── packages/
│   ├── core/           @grip/core
│   ├── extension/      @grip/extension
│   └── mcp-server/     grip-mcp (Go)
├── apps/
│   └── docs/           Next.js docs
├── bin/                grip-mcp binary (built)
├── scripts/
│   └── launch-chrome.sh
├── turbo.json
└── pnpm-workspace.yaml
```

## MCP tools

`snapshot`, `highlight`, `click`, `fill`, `read_logs`, `read_network`, `screenshot`, `pick_element`, `navigate`, `eval`

## Environment variables (grip-mcp)

| Variable | Default | Description |
|----------|---------|-------------|
| `GRIP_CHROME_PORT` | `9222` | Chrome remote debugging port |
| `GRIP_LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |

## License

MIT
