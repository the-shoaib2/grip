import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "build", title: "Build", level: 2 as const },
  { id: "tools", title: "Registered tools", level: 2 as const },
];

export default function McpServerPackagePage() {
  return (
    <DocPage
      title="grip-mcp"
      description="Go MCP server — Chrome DevTools Protocol bridge for browser automation tools."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        <code>grip-mcp</code> lives in <code>packages/mcp-server</code>. It uses{" "}
        <code>github.com/modelcontextprotocol/go-sdk</code> and <code>chromedp</code> to attach to
        Chrome and expose MCP tools to AI clients.
      </p>

      <DocH2 id="build">Build</DocH2>
      <CodeBlock>{`pnpm run build:mcp
# Output: bin/grip-mcp`}</CodeBlock>
      <p>
        Configure your MCP client per the{" "}
        <Link href="/docs/mcp/configuration">configuration guide</Link>.
      </p>

      <DocH2 id="tools">Registered tools</DocH2>
      <p>
        See the full <Link href="/docs/mcp/tools">tools reference</Link> for descriptions and
        workflow guidance.
      </p>
      <ul>
        <li>
          <code>snapshot</code>, <code>highlight</code>, <code>click</code>, <code>fill</code>
        </li>
        <li>
          <code>read_logs</code>, <code>read_network</code>, <code>screenshot</code>
        </li>
        <li>
          <code>pick_element</code>, <code>navigate</code>, <code>eval</code>
        </li>
      </ul>
    </DocPage>
  );
}
