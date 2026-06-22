# Grip — Project Structure

```
grip/
├── apps/
│   └── docs/                    # @grip/docs — Next.js site
├── packages/
│   ├── core/                    # @grip/core — shared TS library
│   ├── extension/               # @grip/extension — Chrome MV3
│   └── mcp-server/              # grip-mcp — Go MCP server
├── scripts/
├── bin/grip-mcp
├── tsconfig.base.json           # shared TS + @grip/core path
└── turbo.json
```

## Import aliases

| Alias | Resolves to | Used in |
|-------|-------------|---------|
| `@grip/core` | `packages/core/src/index.ts` | extension, docs (workspace) |
| `@grip/core/types` | `packages/core/src/types/index.ts` | optional subpath export |
| `@/*` | `packages/extension/src/*` | extension only |
| `#types/*` | `packages/core/src/types/*` | core internal (package imports) |

### Extension (`@/`)

```ts
import { CopyButton, Tooltip } from "@/components";
import { useGripStore } from "@/stores";
import { safeSendMessage } from "@/lib";
import { showTray } from "@/content_scripts/tray";
import "@/styles/globals.css";
import { formatMcpPrompt } from "@grip/core";
```

### Core

```ts
import type { StoredPick } from "./types/messages.js";
import type { A11ySnapshot } from "./types/a11y.js";
// public: import { ... } from "@grip/core";
```

### MCP server (Go module paths)

```go
import "github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
import "github.com/the-shoaib2/grip/packages/mcp-server/internal/tools"
```

---

## `packages/core` (`@grip/core`)

```
packages/core/src/
├── index.ts                 # public barrel
├── types/
│   ├── index.ts             # type barrel
│   ├── a11y.ts              # snapshot, CDP, selector types
│   └── messages.ts          # extension IPC + StoredPick
├── selector.ts
├── ref-map.ts
├── snapshot.ts
├── serializer.ts
├── pick-history.ts
├── mcp-prompt.ts
└── *.test.ts
```

---

## `packages/extension` (`@grip/extension`)

```
packages/extension/src/
├── components/              # UI — import via @/components
│   └── index.ts
├── stores/                  # Zustand — @/stores
│   └── index.ts
├── lib/                     # runtime helpers — @/lib
│   └── index.ts
├── styles/globals.css       # @/styles/globals.css
├── content_scripts/         # MV3 content scripts (manifest paths)
│   ├── picker.ts
│   ├── tray.ts
│   ├── navigator.ts
│   └── log-injector.ts
├── service_worker/
│   └── background.ts
├── popup/
└── devtools/panel/
```

---

## `packages/mcp-server` (Go)

```
packages/mcp-server/
├── cmd/grip-mcp/main.go
├── internal/
│   ├── cdp/                 # chromedp session + listeners
│   ├── server/              # MCP bootstrap
│   └── tools/               # one file per MCP tool
│       ├── register.go
│       ├── snapshot.go
│       └── ...
└── go.mod
```

---

## Data flow

```
Browser page → content_scripts → @grip/core → service_worker → DevTools panel
AI agent → grip-mcp (internal/tools) → chromedp → Chrome :9222
```
