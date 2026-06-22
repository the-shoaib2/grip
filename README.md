# Grip

Grip is a browser automation MCP server that connects to external Chrome via the Chrome DevTools Protocol (CDP). It gives Cursor agents tools to snapshot pages, interact with elements, read console logs, inspect network traffic, and pick elements visually.

## Requirements

- Node.js 20+
- Google Chrome or Chromium

## Quick Start

### 1. Launch Chrome with remote debugging

```bash
chmod +x scripts/launch-chrome.sh
./scripts/launch-chrome.sh 9229
```

Or manually:

```bash
google-chrome --remote-debugging-port=9229
```

Open a tab and navigate to the page you want to inspect.

### 2. Build Grip

```bash
npm install
npm run build
```

### 3. Enable in Cursor

The project includes [`.cursor/mcp.json`](.cursor/mcp.json):

```json
{
  "mcpServers": {
    "grip": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/cli.js", "--port", "9229"],
      "env": { "GRIP_LOG_LEVEL": "info" }
    }
  }
}
```

Reload Cursor MCP servers after building. The Grip skill is at [`.cursor/skills/grip/SKILL.md`](.cursor/skills/grip/SKILL.md).

### 4. Optional: global CLI

```bash
npm link
```

Then update `mcp.json` to use `"command": "grip-mcp"`.

## MCP Tools

| Tool | Description |
|------|-------------|
| `snapshot` | Accessibility tree + ref map (optional `frameId` for iframes) |
| `highlight` | Blue overlay on element by ref |
| `click` | Click element by ref |
| `fill` | Type into input/textarea by ref |
| `read_logs` | Buffered console output (`log`, `warn`, `error`, `all`) |
| `read_network` | HAR-style network entries with optional filters |
| `screenshot` | Full page or element screenshot (base64 PNG) |
| `pick_element` | Visual picker — user clicks an element in Chrome |

## Agent Workflow

1. **snapshot** before any interaction
2. **highlight** before click/fill
3. **read_logs** after actions
4. Re-**snapshot** after navigation

Refs expire on navigation. Grip debounces snapshots to max 1 per 500ms.

## Limitations (v1)

- Chrome only (CDP)
- No `navigate` or `tabs` tools — control the browser manually
- Auto-attaches to the most recently opened page target
- `pick_element` blocks up to 60s waiting for user click

## Development

```bash
npm run dev    # watch build
npm run typecheck
node dist/cli.js --port 9229
```

## License

MIT
