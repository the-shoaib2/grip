import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";
import { McpClientTabs } from "@components/docs/McpClientTabs";
import { gripMcpReference } from "@lib/mcp-clients";

const toc = [
  { id: "overview", title: "How it works", level: 2 as const },
  { id: "chrome", title: "Step 1 — Launch Chrome", level: 2 as const },
  { id: "build-mcp", title: "Step 2 — Build grip-mcp", level: 2 as const },
  { id: "reference", title: "Step 3 — Server config", level: 2 as const },
  { id: "clients", title: "Pick your client", level: 2 as const },
  { id: "cli-agents", title: "CLI Agents & Daemon Mode", level: 2 as const },
  { id: "env", title: "Environment variables", level: 2 as const },
  { id: "ui-badge", title: "MCP badge in Grip UI", level: 2 as const },
  { id: "troubleshooting", title: "Troubleshooting", level: 2 as const },
  { id: "badge-stays-yellow", title: "Badge stays yellow", level: 3 as const },
  { id: "connection-refused", title: "Connection refused", level: 3 as const },
  { id: "wrong-root-key", title: "Server not loading", level: 3 as const },
];

export default function McpConfigurationPage() {
  return (
    <DocPage
      title="MCP configuration"
      description="Connect grip-mcp to Chrome, then add it to your editor or CLI — Cursor, VS Code, Claude Code, Gemini CLI, OpenCode, and more."
      toc={toc}
    >
      <DocH2 id="overview">How it works</DocH2>
      <p>
        <code>grip-mcp</code> is a small Go program that connects to Chrome and exposes browser tools
        over{" "}
        <a href="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noreferrer">
          MCP
        </a>
        . Your AI client runs <code>grip-mcp</code> as a subprocess; Grip routes tool calls to the
        tab you have open in debugging Chrome.
      </p>
      <p>
        Setup is three steps: launch Chrome with debugging, build <code>grip-mcp</code>, then paste
        a config block into your IDE or CLI. Most tools use the same shape — only the{" "}
        <strong>config file path</strong> and <strong>root JSON key</strong> differ.
      </p>

      <DocH2 id="chrome">Step 1 — Launch Chrome</DocH2>
      <p>Start Chrome with remote debugging enabled:</p>
      <CodeBlock>{`./scripts/launch-chrome.sh 9222`}</CodeBlock>
      <DocTip>
        Use one debugging Chrome instance per port. If something else is on 9222, pick another port
        and set <code>GRIP_CHROME_PORT</code> to match.
      </DocTip>

      <DocH2 id="build-mcp">Step 2 — Build grip-mcp</DocH2>
      <CodeBlock>{`pnpm run build:mcp
# Creates bin/grip-mcp`}</CodeBlock>

      <DocH2 id="reference">Step 3 — Server config</DocH2>
      <p>
        Copy this block into your client&apos;s config. Replace the command path with your real path
        to <code>bin/grip-mcp</code>:
      </p>
      <CodeBlock>{gripMcpReference}</CodeBlock>
      <p>
        Then pick your tool below. You can also pass <code>--port 9222</code> as a CLI arg instead
        of <code>GRIP_CHROME_PORT</code> where your client supports <code>args</code>.
      </p>

      <DocH2 id="clients">Pick your client</DocH2>
      <p>
        Choose <strong>IDEs &amp; editors</strong> or <strong>CLI &amp; terminal</strong>, then
        select your app to see the exact config file, root key, and copy-paste snippet.
      </p>
      <McpClientTabs />

      <DocH2 id="cli-agents">CLI Agents &amp; Daemon Mode</DocH2>
      <p>
        For command-line execution (e.g., using <code>Claude Code</code> or <code>Gemini CLI</code>), <code>grip-mcp</code> runs as a headless background subprocess rather than a visual application.
      </p>
      <ul>
        <li>
          <strong>Daemon Lifecycle:</strong> The host CLI agent starts <code>grip-mcp</code> automatically and communicates with it over standard input/output (stdio).
        </li>
        <li>
          <strong>CDP Connection:</strong> The background daemon hooks directly into Chrome via the remote debugging port (configured by <code>GRIP_CHROME_PORT</code>) using the Chrome DevTools Protocol.
        </li>
        <li>
          <strong>Global CLI Installation:</strong> If you use CLI tools globally, you can link the executable to your path:
          <CodeBlock>{`# Link globally for easy access
npm link
# Or run direct from local path
claude mcp add grip -- $(pwd)/bin/grip-mcp`}</CodeBlock>
        </li>
      </ul>

      <DocH2 id="env">Environment variables</DocH2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Default</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GRIP_CHROME_PORT</code></td>
            <td><code>9222</code></td>
            <td>Port where Chrome remote debugging is listening</td>
          </tr>
          <tr>
            <td><code>GRIP_LOG_LEVEL</code></td>
            <td><code>info</code></td>
            <td>
              Log verbosity: <code>debug</code>, <code>info</code>, <code>warn</code>, or{" "}
              <code>error</code>
            </td>
          </tr>
        </tbody>
      </table>

      <DocH2 id="ui-badge">MCP badge in Grip UI</DocH2>
      <p>
        The Grip popup, DevTools panel, and floating tray show a small <strong>MCP</strong> chip in
        the header so you can see connection status at a glance:
      </p>
      <ul>
        <li>
          <span className="doc-inline-ok">Green</span> — Chrome is reachable on your configured port
        </li>
        <li>
          <span className="doc-inline-warn">Yellow</span> — not set up yet; click for this guide
        </li>
      </ul>

      <DocH2 id="troubleshooting">Troubleshooting</DocH2>
      <DocH3 id="badge-stays-yellow">Badge stays yellow</DocH3>
      <ul>
        <li>Is Chrome running with <code>--remote-debugging-port=9222</code>?</li>
        <li>Does <code>GRIP_CHROME_PORT</code> match your launch script?</li>
        <li>Restart your MCP client after editing config</li>
      </ul>
      <DocH3 id="connection-refused">Connection refused</DocH3>
      <p>
        Port 9222 may be in use, or Chrome wasn&apos;t started with debugging. Re-run{" "}
        <code>launch-chrome.sh</code> or choose a free port and update Chrome + MCP env together.
      </p>
      <DocH3 id="wrong-root-key">Server not loading</DocH3>
      <p>
        Config copied from the wrong app is the most common issue. VS Code wants{" "}
        <code>servers</code>, Zed wants <code>context_servers</code>, OpenCode wants{" "}
        <code>mcp</code> — check the root key in the client tab above.
      </p>
    </DocPage>
  );
}
