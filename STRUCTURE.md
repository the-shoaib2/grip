# Grip — Project Structure

```
grip/
├── apps/
│   ├── docs/                    # @grip/docs — Next.js site
│   └── playground/              # @grip/playground — Vite UI lab + fixture
├── packages/
│   ├── core/                    # @grip/core — shared TS library
│   ├── devtools/                # @grip/devtools — shared Preact UI + DOM lib
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
| `@grip/devtools/lib` | `packages/devtools/src/lib/index.ts` | formal package export (picker, inline composer DOM) |
| `@grip/devtools-lib` | `packages/devtools/src/lib/index.ts` | extension content scripts (legacy alias) |
| `@grip/devtools-floating` | `packages/devtools/src/floating/index.ts` | extension content script |
| `@grip/devtools-css` | `packages/devtools/src/styles/globals.css` | extension popup/panel |
| `@/*` | `packages/extension/src/*` | extension only |
| `#types/*` | `packages/core/src/types/*` | core internal (package imports) |

### Extension (`@/`)

```ts
import { safeSendMessage } from "@/lib";
import { createPicker } from "@grip/devtools/lib";
import { mountFloatingGrip } from "@grip/devtools-floating";
import { GripPopupView, chromeRuntime } from "@grip/devtools";
import "@grip/devtools-css";
import { formatMcpPrompt, gripUserError } from "@grip/core";
```

### DevTools (`@grip/devtools`)

```ts
import { GripPanelView, GripRuntimeProvider, chromeRuntime } from "@grip/devtools";
import { mountFloatingGrip } from "@grip/devtools-floating";
import { createPicker, bindEditorClipboard } from "@grip/devtools/lib";
```

### Core

```ts
import type { StoredPick } from "./types/messages.js";
import { mergeSessionOrder, gripUserError } from "@grip/core";
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
├── errors.ts                # GRIP_ERROR, gripUserError
├── types/
│   ├── index.ts             # type barrel
│   ├── a11y.ts              # snapshot, CDP, ElementRect
│   └── messages.ts          # extension IPC + StoredPick
├── session-handlers/        # pure session-order helpers
├── selector.ts
├── ref-map.ts
├── snapshot.ts
├── serializer.ts
├── pick-history.ts
├── stored-pick-composer.ts
├── mcp-prompt.ts
└── *.test.ts
```

---

## `packages/devtools` (`@grip/devtools`)

Shared Preact UI for popup, Chrome DevTools panel, and in-page floating FAB panel.

```
packages/devtools/src/
├── index.ts                 # views, components, runtime, store
├── components/              # one folder per component
├── views/                   # GripPanelView, GripPopupView, LogPanel
├── hooks/
│   └── usePickHistory/      # context, state, actions (split modules)
├── floating/
│   └── mountFloatingGrip/   # shadow DOM FAB + panel
├── runtime/
│   ├── createBaseGripRuntime.ts
│   ├── chrome-runtime/      # GripRuntime adapter
│   ├── devtools-runtime/
│   └── context.tsx          # GripRuntimeProvider
├── store/gripStore.ts
├── lib/
│   ├── picker/              # shared content-script picker engine
│   ├── inlineComposerDom/   # chips, selection, clipboard, keyboard
│   └── chipTooltip/
└── styles/
    ├── globals.css          # @import chain entry
    ├── tailwind.css
    ├── tokens.css
    ├── base.css
    ├── views/               # shell.css, panel.css
    └── components/          # controls.css, composer.css
```

Package exports: `.` (main UI), `./lib` (DOM + picker), `./floating`, `./style.css`.

---

## `packages/extension` (`@grip/extension`)

Thin Chrome MV3 shell — mounts `@grip/devtools` views.

```
packages/extension/src/
├── lib/                     # tab-bridge, types, errors; re-exports devtools lib
├── content_scripts/
│   ├── picker.ts            # thin adapter over @grip/devtools/lib createPicker
│   ├── floating-mount.ts    # FAB + full panel via @grip/devtools-floating
│   ├── navigator.ts
│   └── log-injector.ts
├── service_worker/
│   ├── background.ts        # bootstrap + listener registration
│   ├── messageRouter.ts
│   ├── handlers/            # picker, history, session, panel
│   ├── storage/             # pick history + session maps
│   └── tabLifecycle.ts
├── popup/popup.tsx
└── devtools/panel/panel.tsx
```

---

## `packages/mcp-server` (Go)

```
packages/mcp-server/
├── cmd/grip-mcp/main.go
├── internal/
│   ├── cdp/
│   ├── server/
│   └── tools/               # one file per MCP tool
└── go.mod
```

---

## Data flow

```
Browser page → content_scripts (picker + floating panel) → @grip/devtools/lib → @grip/core → service_worker
Popup / DevTools panel → @grip/devtools → service_worker
Playground → mockRuntime (shared session handlers) + @grip/devtools
AI agent → grip-mcp (internal/tools) → chromedp → Chrome :9222
```
