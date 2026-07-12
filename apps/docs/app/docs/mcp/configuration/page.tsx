import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { McpClientTabs } from "@components/docs/McpClientTabs";
import { PackageManagerTabs } from "@components/docs/PackageManagerTabs";
import { gripMcpReference } from "@lib/mcp-clients";

const toc = [
  { id: "overview", title: "How it works", level: 2 as const },
  { id: "install", title: "Installation", level: 2 as const },
  { id: "reference", title: "Server config", level: 2 as const },
  { id: "clients", title: "Client Setup Guides", level: 2 as const },
  { id: "troubleshooting", title: "Troubleshooting", level: 2 as const },
];

export default function McpConfigurationPage() {
  return (
    <DocPage
      title="MCP configuration"
      description="Connect Grip to your browser, then add it to your editor or CLI — Cursor, VS Code, Claude Code, Gemini CLI, OpenCode, and more."
      toc={toc}
    >
      <DocH2 id="overview">How it works</DocH2>
      <p>
        The <code>@grip/cli</code> daemon connects to any modern browser (Chrome, Edge, Brave) and safely exposes its internal state over the standard Model Context Protocol (MCP).
      </p>
      <p>
        Setup requires two simple steps: <strong>Install the CLI</strong> on your system, and then <strong>paste the configuration block</strong> into your AI IDE. Your AI client will automatically manage the daemon lifecycle.
      </p>

      <DocH2 id="install">Installation</DocH2>
      <p>Install the CLI globally on your system to make the <code>grip</code> command available:</p>
      <PackageManagerTabs />

      <DocH2 id="reference">Server config</DocH2>
      <p>
        This is the base configuration payload required by most MCP clients:
      </p>
      <CodeBlock>{gripMcpReference}</CodeBlock>

      <DocH2 id="clients">Client Setup Guides</DocH2>
      <p>
        Select your specific AI tool below to get the exact configuration snippet and file path required for integration.
      </p>
      <McpClientTabs />

      <DocH2 id="troubleshooting">Troubleshooting</DocH2>
      <DocH3 id="connection-refused">Connection refused</DocH3>
      <p>
        Port <code>9222</code> may be in use, or your browser was not started with the remote debugging flag enabled. Ensure you have completely closed Chrome and restarted it with <code>--remote-debugging-port=9222</code>.
      </p>
      <DocH3 id="wrong-root-key">Server not loading</DocH3>
      <p>
        Ensure you are using the correct root JSON key for your specific editor. For example, VS Code uses <code>servers</code>, Zed uses <code>context_servers</code>, and OpenCode uses <code>mcp</code>. Double check the client tab above.
      </p>
    </DocPage>
  );
}
