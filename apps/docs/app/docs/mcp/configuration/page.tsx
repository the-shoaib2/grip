import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";
import { McpClientTabs } from "@components/docs/McpClientTabs";
import { PackageManagerTabs } from "@components/docs/PackageManagerTabs";
import { gripMcpReference } from "@lib/mcp-clients";

const toc = [
  { id: "overview", title: "How it works", level: 2 as const },
  { id: "build-mcp", title: "Install grip-cli", level: 2 as const },
  { id: "reference", title: "Server config", level: 2 as const },
  { id: "clients", title: "Pick your client", level: 2 as const },
  { id: "cli-agents", title: "CLI Agents & Daemon Mode", level: 2 as const },
  { id: "env", title: "Environment variables", level: 2 as const },
  { id: "troubleshooting", title: "Troubleshooting", level: 2 as const },
  { id: "connection-refused", title: "Connection refused", level: 3 as const },
  { id: "wrong-root-key", title: "Server not loading", level: 3 as const },
];

export default function McpConfigurationPage() {
  return (
    <DocPage
      title="MCP configuration"
      description="Connect grip-cli to your browser, then add it to your editor or CLI — Cursor, VS Code, Claude Code, Gemini CLI, OpenCode, and more."
      toc={toc}
    >
      <DocH2 id="overview">How it works</DocH2>
      <p>
        <code>grip-cli</code> connects to any modern browser (Chrome, Edge, Brave) and exposes browser tools
        over{" "}
        <a href="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noreferrer">
          MCP
        </a>
        . Your AI client runs <code>grip-cli</code> as a subprocess; Grip routes tool calls to the
        tab you have open in the debugging browser.
      </p>
      <p>
        Setup is two steps: install <code>grip-cli</code>, then paste
        a config block into your IDE or CLI. Most tools use the same shape — only the{" "}
        <strong>config file path</strong> and <strong>root JSON key</strong> differ.
      </p>

      <DocH2 id="build-mcp">Install grip-cli</DocH2>
      <p>Install the CLI globally on your system. It works on Mac, Windows, and Linux without any Node.js dependencies:</p>
      <PackageManagerTabs />

      <DocH2 id="reference">Server config</DocH2>
      <p>
        Copy this block into your client&apos;s config:
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
        For command-line execution (e.g., using <code>Claude Code</code> or <code>Gemini CLI</code>), <code>grip-cli</code> runs as a headless background subprocess rather than a visual application.
      </p>
      <ul>
        <li>
          <strong>Daemon Lifecycle:</strong> The host CLI agent starts <code>grip-cli</code> automatically and communicates with it over standard input/output (stdio).
        </li>
        <li>
          <strong>CDP Connection:</strong> The background daemon hooks directly into the browser via the remote debugging port (configured by <code>GRIP_CHROME_PORT</code>) using the Chrome DevTools Protocol.
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
            <td>Port where browser remote debugging is listening</td>
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

      <DocH2 id="troubleshooting">Troubleshooting</DocH2>
      <DocH3 id="connection-refused">Connection refused</DocH3>
      <p>
        Port 9222 may be in use, or the browser wasn&apos;t started with debugging. Restart the browser with the debugging flag, or choose a free port and update your MCP env together.
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
