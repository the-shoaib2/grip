import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "chrome", title: "Chrome remote debugging", level: 2 as const },
  { id: "build-mcp", title: "Build grip-mcp", level: 2 as const },
  { id: "cursor", title: "Cursor configuration", level: 2 as const },
  { id: "env", title: "Environment variables", level: 2 as const },
  { id: "ui-badge", title: "UI connection badge", level: 2 as const },
  { id: "troubleshooting", title: "Troubleshooting", level: 2 as const },
  { id: "badge-stays-yellow", title: "Badge stays yellow", level: 3 as const },
  { id: "connection-refused", title: "Connection refused", level: 3 as const },
];

export default function McpConfigurationPage() {
  return (
    <DocPage
      title="MCP configuration"
      description="Connect grip-mcp to Chrome over the remote debugging port and configure your MCP client."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        <code>grip-mcp</code> is a Go MCP server that speaks Chrome DevTools Protocol (CDP) to the
        browser. AI clients (Cursor, Claude Desktop, etc.) call MCP tools like{" "}
        <code>snapshot</code> and <code>click</code>; Grip routes those to the active Chrome tab.
      </p>
      <p>
        Grip follows the same integration model as other MCP servers documented at{" "}
        <a href="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noreferrer">
          modelcontextprotocol.io
        </a>
        .
      </p>

      <DocH2 id="chrome">Chrome remote debugging</DocH2>
      <p>Launch Chrome with a dedicated user profile and debugging port:</p>
      <CodeBlock>{`./scripts/launch-chrome.sh 9222`}</CodeBlock>
      <p>
        Default port is <code>9222</code>. Only one debugging Chrome instance should bind to a port
        at a time.
      </p>

      <DocH2 id="build-mcp">Build grip-mcp</DocH2>
      <CodeBlock>{`pnpm run build:mcp
# Output: bin/grip-mcp`}</CodeBlock>

      <DocH2 id="cursor">Cursor configuration</DocH2>
      <p>
        Add to <code>.cursor/mcp.json</code> (project) or your global MCP config. Use an absolute
        path to <code>grip-mcp</code> if the working directory differs:
      </p>
      <CodeBlock>{`{
  "mcpServers": {
    "grip": {
      "command": "/path/to/grip/bin/grip-mcp",
      "env": {
        "GRIP_CHROME_PORT": "9222",
        "GRIP_LOG_LEVEL": "info"
      }
    }
  }
}`}</CodeBlock>

      <DocH2 id="env">Environment variables</DocH2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GRIP_CHROME_PORT</code></td>
            <td><code>9222</code></td>
            <td>Chrome remote debugging port</td>
          </tr>
          <tr>
            <td><code>GRIP_LOG_LEVEL</code></td>
            <td><code>info</code></td>
            <td><code>debug</code> · <code>info</code> · <code>warn</code> · <code>error</code></td>
          </tr>
        </tbody>
      </table>

      <DocH2 id="ui-badge">UI connection badge</DocH2>
      <p>
        The Grip popup, DevTools panel, and floating tray show an <strong>MCP</strong> chip in the
        header:
      </p>
      <ul>
        <li>
          <span className="doc-inline-ok">Green</span> — MCP server reachable on the configured port
        </li>
        <li>
          <span className="doc-inline-warn">Yellow</span> — not configured; click for this setup guide
        </li>
      </ul>

      <DocH2 id="troubleshooting">Troubleshooting</DocH2>
      <DocH3 id="badge-stays-yellow">Badge stays yellow</DocH3>
      <ul>
        <li>Confirm Chrome is running with <code>--remote-debugging-port=9222</code></li>
        <li>Verify <code>GRIP_CHROME_PORT</code> matches your launch script</li>
        <li>Restart the MCP server after changing config</li>
      </ul>
      <DocH3 id="connection-refused">Connection refused</DocH3>
      <p>
        Another process may be using port 9222, or Chrome was started without remote debugging.
        Re-run <code>launch-chrome.sh</code> or pick a free port and update both Chrome and MCP env.
      </p>
    </DocPage>
  );
}
