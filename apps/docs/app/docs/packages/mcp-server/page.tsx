import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "overview", title: "What it is", level: 2 as const },
  { id: "build", title: "Build the server", level: 2 as const },
  { id: "tools", title: "Tools it exposes", level: 2 as const },
];

export default function McpServerPackagePage() {
  return (
    <DocPage
      title="grip-mcp"
      description="The Go MCP server that connects AI clients to Chrome — snapshot, click, fill, logs, and more."
      toc={toc}
    >
      <DocH2 id="overview">What it is</DocH2>
      <p>
        <code>grip-mcp</code> lives in <code>packages/mcp-server</code>. It uses the official MCP Go
        SDK and <code>chromedp</code> to attach to Chrome and expose browser tools your IDE or CLI
        can call.
      </p>
      <p>
        You don&apos;t run it by hand in normal use — your MCP client (Cursor, Claude Code, etc.)
        starts it as a subprocess when you open a session.
      </p>

      <DocH2 id="build">Build the server</DocH2>
      <CodeBlock>{`pnpm run build:mcp
# Output: bin/grip-mcp`}</CodeBlock>
      <DocTip>
        Point your MCP config at the absolute path of <code>bin/grip-mcp</code>. See{" "}
        <Link href="/docs/mcp/configuration">MCP configuration</Link> for your specific editor or
        CLI.
      </DocTip>

      <DocH2 id="tools">Tools it exposes</DocH2>
      <p>
        Ten tools for page inspection and interaction. Each one is documented with when to use it in
        the <Link href="/docs/mcp/tools">tools reference</Link>:
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
