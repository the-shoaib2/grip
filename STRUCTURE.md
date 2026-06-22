# Grip — Project Structure

```
grip/
├── apps/
│   └── docs/                    # @grip/docs — Next.js site
├── packages/
│   ├── core/                    # @grip/core — shared TS library
│   ├── devtools/                # @grip/devtools — shared Preact UI
│   ├── extension/               # @grip/extension — Chrome MV3
│   └── mcp-server/              # grip-mcp — Go MCP server
├── scripts/
├── bin/grip-mcp
├── tsconfig.base.json           # shared TS + workspace paths
└── turbo.json
```

## Import aliases

| Alias | Resolves to | Used in |
|-------|-------------|---------|
| `@grip/core` | `packages/core/src/index.ts` | extension, devtools, docs |
| `@grip/devtools` | `packages/devtools/src/index.ts` | extension popup, DevTools panel |
| `@grip/devtools-floating` | `packages/devtools/src/floating/index.ts` | extension content script |
| `@grip/devtools-lib` | `packages/devtools/src/lib/index.ts` | extension picker (no CSS side effects) |
| `@grip/devtools-css` | `packages/devtools/src/styles/globals.css` | extension popup/panel |
| `@/*` | `packages/extension/src/*` | extension only |
| `#types/*` | `packages/core/src/types/*` | core internal (package imports) |

### Extension (`@/`)

```ts
import { safeSendMessage } from "@/lib";
import { mountFloatingGrip } from "@grip/devtools-floating";
import { GripPopupView, chromeRuntime } from "@grip/devtools";
import "@grip/devtools-css";
import { formatMcpPrompt } from "@grip/core";
```

### DevTools (`@grip/devtools`)

```ts
import { GripPanelView, GripRuntimeProvider, chromeRuntime } from "@grip/devtools";
import { mountFloatingGrip } from "@grip/devtools-floating";
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

## `packages/devtools` (`@grip/devtools`)

Shared Preact UI for popup, Chrome DevTools panel, and in-page floating FAB panel.

```
packages/devtools/src/
├── index.ts                 # views, components, runtime, store
├── components/              # CommentField, PickHistoryList, …
├── views/
│   ├── GripPanelView.tsx    # full panel (pick, history, copy, logs)
│   ├── GripPopupView.tsx    # compact toolbar popup
│   └── LogPanel.tsx
├── floating/
│   ├── mountFloatingGrip.tsx  # shadow DOM FAB + panel
│   └── FloatingShell.tsx
├── runtime/
│   ├── chrome-runtime.ts    # GripRuntime adapter for chrome.*
│   └── context.tsx          # GripRuntimeProvider
├── store/gripStore.ts
├── lib/                     # inlineComposerDom, chipTooltip
└── styles/globals.css
```

---

## `packages/extension` (`@grip/extension`)

Thin Chrome MV3 shell — mounts `@grip/devtools` views.

```
packages/extension/src/
├── lib/                     # tab-bridge, errors; re-exports devtools lib
├── content_scripts/
│   ├── picker.ts            # vanilla DOM overlay (unchanged)
│   ├── floating-mount.ts    # FAB + full panel via @grip/devtools-floating
│   ├── navigator.ts
│   └── log-injector.ts
├── service_worker/
│   └── background.ts
├── popup/popup.tsx          # mounts GripPopupView
└── devtools/panel/panel.tsx # mounts GripPanelView
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
Browser page → content_scripts (picker + floating panel) → @grip/core → service_worker
Popup / DevTools panel → @grip/devtools → service_worker
AI agent → grip-mcp (internal/tools) → chromedp → Chrome :9222
```
