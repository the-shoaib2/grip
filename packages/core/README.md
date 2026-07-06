# grip-dev

Grip Core Primitives & MCP Client Utilities.

`grip-dev` provides framework-agnostic utilities for browser automation, accessibility snapshots, DOM selectors, pick history management, and Model Context Protocol (MCP) integrations.

---

## Installation

```bash
npm install grip-dev
```

*Requires Node.js 20+.*

---

## Features & Usage

### 1. MCP Client Utilities (`grip-dev/mcp`)
Use this subpath to generate client configurations, format picked elements into prompt messages, and preflight browser connections:

```typescript
import {
  checkChromeDebugPort,
  createCursorGripMcpConfig,
  formatGripMcpClientConfig,
  formatMcpPrompt
} from "grip-dev/mcp";

// 1. Generate IDE configs (e.g. Cursor, VS Code, Zed)
const cursorConfig = createCursorGripMcpConfig();
const vscodeConfig = formatGripMcpClientConfig("servers", {
  command: "/path/to/grip-mcp",
});

// 2. Preflight Chrome remote debugging connection
const connection = await checkChromeDebugPort(9222);
if (connection.ok) {
  console.log(`Connected to: ${connection.browser}`);
}

// 3. Format picked element context into agent prompts
const prompt = formatMcpPrompt({
  tagName: "BUTTON",
  role: "button",
  innerText: "Submit Request",
  css: "button.primary-btn",
  xpath: "//button[@id='submit']",
  rect: { top: 120, left: 450, width: 120, height: 36 },
  name: "Submit Request",
  shadowDOM: false,
  iframe: "top",
});
```

### 2. Main Core APIs (`grip-dev`)
Import primary primitives for DOM picking, DOM selectors, and accessibility tree parsing:

```typescript
import { buildSnapshotForLLM, generateSelector } from "grip-dev";

// Generate unique DOM selectors
const cssSelector = generateSelector(domElement);

// Build accessibility tree snapshots for LLM context
const snapshot = buildSnapshotForLLM(document);
```

#### Core Modules Reference

| Module | Core Exports | Description |
|---|---|---|
| **Selectors** | `generateSelector`, `generateXPath`, `pickTargetAtPoint` | Robust unique path generation for elements. |
| **Snapshots** | `buildSnapshot`, `buildSnapshotForLLM`, `serializeForLLM` | Generates semantic accessibility trees for AI agents. |
| **Composer** | `parseInlineComment`, `gripChipToken`, `formatInlineCommentForMcp` | Tokenizes user instructions and context chips. |
| **History** | `appendPickHistory`, `mergeSessionOrder`, `toStoredPick` | Handles session picking timelines and ordering. |

---

## MCP Server (`grip-mcp`)
The Go-based MCP automation server is published separately. To build and execute the server binary locally, refer to the [Grip Monorepo GitHub repository](https://github.com/the-shoaib2/grip).

```bash
pnpm run build:mcp # Compiles the binary to bin/grip-mcp
```

---

## License
MIT
