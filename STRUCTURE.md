# Grip — Project Structure

```
grip/
├── .changeset/              # Versioning (Changesets)
├── .cursor/
│   ├── mcp.json             # Cursor MCP config → bin/grip-mcp
│   └── skills/grip/         # Agent skill (SKILL.md)
├── .github/workflows/
│   └── ci.yml               # lint, test, build, grip-mcp
├── apps/
│   └── docs/                # @grip/docs — Next.js documentation site
│       └── app/
│           ├── page.tsx     # Home
│           ├── docs/        # Quick start
│           ├── tools/       # MCP tool reference
│           └── extension/   # Extension guide
├── bin/
│   └── grip-mcp             # Built Go binary (gitignored)
├── packages/
│   ├── core/                # @grip/core
│   │   └── src/
│   │       ├── selector.ts      # @medv/finder + XPath
│   │       ├── ref-map.ts       # Ephemeral CDP refs
│   │       ├── snapshot.ts      # Accessibility.getFullAXTree
│   │       ├── serializer.ts    # LLM YAML/JSON output
│   │       └── types/messages.ts # Extension IPC types
│   ├── extension/           # @grip/extension — Chrome MV3
│   │   └── src/
│   │       ├── content_scripts/
│   │       │   ├── picker.ts
│   │       │   └── log-injector.ts
│   │       ├── service_worker/background.ts
│   │       ├── stores/gripStore.ts   # Zustand
│   │       ├── styles/globals.css    # Tailwind
│   │       ├── popup/
│   │       └── devtools/panel/
│   └── mcp-server/          # grip-mcp — Go
│       ├── cmd/grip-mcp/main.go
│       ├── internal/
│       │   ├── cdp/             # chromedp session + listeners
│       │   └── server/          # MCP server bootstrap
│       └── tools/               # One file per MCP tool
│           ├── snapshot.go
│           ├── highlight.go
│           ├── click.go
│           ├── fill.go
│           ├── read_logs.go
│           ├── read_network.go
│           ├── screenshot.go
│           ├── pick_element.go
│           ├── navigate.go
│           └── eval.go
├── scripts/
│   ├── build-mcp.sh
│   ├── ensure-go.sh
│   └── launch-chrome.sh
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.mjs
└── LICENSE
```

## Data flow

```
Browser page
  → extension content_scripts (picker, log-injector)
  → @grip/core (generateSelector)
  → service_worker → DevTools panel (Zustand)

AI agent (Cursor)
  → grip-mcp (tools/*.go)
  → chromedp → Chrome :9222
```
