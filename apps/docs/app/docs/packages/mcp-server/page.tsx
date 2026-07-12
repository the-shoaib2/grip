import Link from "next/link";
import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "tools", title: "Tools exposed", level: 2 as const },
];

export default function McpServerPackagePage() {
  return (
    <DocPage
      title="grip-mcp (Go Legacy)"
      description="The original Go-based MCP server for connecting AI clients to Chrome."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        <code>grip-mcp</code> is the original Go-based implementation of the Grip MCP server, utilizing the official MCP Go SDK and <code>chromedp</code> to attach to Chrome and expose browser tools.
      </p>
      <DocTip>
        <strong>Note:</strong> <code>grip-mcp</code> is largely considered a legacy implementation. The recommended path for all modern deployments is the standalone TypeScript daemon, <code>@grip/cli</code>. See the <Link href="/docs/packages/cli">CLI documentation</Link> for the modern approach.
      </DocTip>

      <DocH2 id="tools">Tools exposed</DocH2>
      <p>
        Like the modern CLI, this server exposes standard tools for page inspection and interaction via the Model Context Protocol. You can find detailed usage for these tools in the <Link href="/docs/mcp/tools">tools reference guide</Link>:
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
