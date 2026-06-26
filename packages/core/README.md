# @grip/core

Shared Grip primitives: accessibility snapshots, selectors, pick history, inline composer tokens, and **MCP client helpers** for wiring Grip into AI coding agents.

Grip pairs a browser extension (human element picking) with **grip-mcp** (agent browser automation over Chrome DevTools Protocol). This package is the TypeScript side of that bridge.

## Install

```bash
npm install @grip/core
```

Requires Node 20+.

## MCP client (`@grip/core/mcp`)

Use this subpath when building docs, IDE setup wizards, or copy-to-clipboard flows.

```ts
import {
  GRIP_MCP_TOOLS,
  GRIP_MCP_DEFAULT_PORT,
  checkChromeDebugPort,
  formatMcpPrompt,
  createGripMcpClientConfig,
  createCursorGripMcpConfig,
  formatGripMcpClientConfig,
} from "@grip/core/mcp";

// Generate Cursor / Claude Desktop style config
const config = createCursorGripMcpConfig();
// { mcpServers: { grip: { command: "${workspaceFolder}/bin/grip-mcp", ... } } }

// Or any supported root key: mcpServers | servers | context_servers | mcp
const vscode = formatGripMcpClientConfig("servers", {
  command: "/path/to/grip/bin/grip-mcp",
});

// Verify Chrome remote debugging before starting grip-mcp
const { ok, browser } = await checkChromeDebugPort(9222);

// Format a human pick for pasting into an agent chat
const prompt = formatMcpPrompt({
  tagName: "BUTTON",
  role: "button",
  innerText: "Submit",
  css: "button.primary",
  xpath: "//button[1]",
  rect: { top: 0, left: 0, width: 100, height: 40 },
  name: "Submit",
  shadowDOM: false,
  iframe: "top",
});
```

### grip-mcp server

The MCP **server** is a separate Go binary (`grip-mcp`), not published to npm. Build from the [Grip monorepo](https://github.com/the-shoaib2/grip):

```bash
pnpm run build:mcp   # → bin/grip-mcp
```

Point your MCP client at `bin/grip-mcp` with `GRIP_CHROME_PORT=9222` (Chrome must be launched with `--remote-debugging-port=9222`).

See [docs/MCP.md](../../docs/MCP.md) in the repo for full architecture.

## Main exports

| Area | Examples |
|------|----------|
| Selectors | `generateSelector`, `generateXPath`, `pickTargetAtPoint` |
| Snapshots | `buildSnapshot`, `buildSnapshotForLLM`, `serializeForLLM` |
| Pick history | `appendPickHistory`, `pickLabel`, `toStoredPick` |
| Composer | `parseInlineComment`, `gripChipToken`, `formatInlineCommentForMcp` |
| Sessions | `mergeSessionOrder`, `reconcileSessionOrderAfterPickDelete` |

```ts
import { buildSnapshotForLLM, generateSelector } from "@grip/core";
```

## License

MIT
