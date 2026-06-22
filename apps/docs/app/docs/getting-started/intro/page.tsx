import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocCard, DocCardGrid } from "@components/docs/DocCard";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";

const toc = [
  { id: "what-is-grip", title: "What is Grip?", level: 2 as const },
  { id: "what-can-grip-enable", title: "What can Grip enable?", level: 2 as const },
  { id: "why-grip-matters", title: "Why does Grip matter?", level: 2 as const },
  { id: "developers", title: "Developers", level: 3 as const },
  { id: "ai-agents", title: "AI applications & agents", level: 3 as const },
  { id: "end-users", title: "End users", level: 3 as const },
  { id: "start-building", title: "Start building", level: 2 as const },
  { id: "learn-more", title: "Learn more", level: 2 as const },
];

export default function IntroPage() {
  return (
    <DocPage
      title="What is Grip?"
      description="Grip is an open-source browser element selector, accessibility inspector, and AI agent browser interface — built to connect web pages to MCP clients."
      toc={toc}
    >
      <DocH2 id="what-is-grip">What is Grip?</DocH2>
      <p>
        Grip helps developers and AI agents inspect, select, and interact with any web page. It
        combines a Chrome extension (visual picker, DevTools panel, floating tray), a shared{" "}
        <code>@grip/core</code> library for selectors and accessibility snapshots, and{" "}
        <code>grip-mcp</code> — an MCP server that exposes browser automation tools to editors like{" "}
        <a href="https://cursor.com/docs/context/mcp" target="_blank" rel="noreferrer">
          Cursor
        </a>
        .
      </p>
      <p>
        Think of Grip like a bridge between the live browser and your AI workflow. The extension
        captures element context on the page; MCP tools let agents snapshot, click, fill, read logs,
        and more over Chrome DevTools Protocol (CDP).
      </p>

      <DocH2 id="what-can-grip-enable">What can Grip enable?</DocH2>
      <ul>
        <li>AI agents can snapshot a page&apos;s accessibility tree and interact with elements by ref.</li>
        <li>Developers can visually pick elements and copy CSS, XPath, or MCP-ready prompts.</li>
        <li>Debug workflows surface console logs and network traffic alongside element metadata.</li>
        <li>Teams can share pick history and session context across popup, DevTools panel, and floating UI.</li>
      </ul>

      <DocH2 id="why-grip-matters">Why does Grip matter?</DocH2>
      <DocH3 id="developers">Developers</DocH3>
      <p>
        Grip reduces friction when building or debugging browser automation. Pick once, get stable
        selectors and accessibility metadata without hand-writing brittle CSS paths.
      </p>
      <DocH3 id="ai-agents">AI applications &amp; agents</DocH3>
      <p>
        Through{" "}
        <a href="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noreferrer">
          Model Context Protocol (MCP)
        </a>
        , agents gain structured access to the browser — snapshots, clicks, fills, logs, and network
        data — with refs that map to the live accessibility tree.
      </p>
      <DocH3 id="end-users">End users</DocH3>
      <p>
        A single extension UI (popup, DevTools panel, or in-page floating tray) keeps picking and
        history consistent no matter how you open Grip.
      </p>

      <DocH2 id="start-building">Start building</DocH2>
      <DocCardGrid>
        <DocCard
          title="Quick start"
          description="Install dependencies, build packages, and launch Chrome with debugging."
          href="/docs/getting-started/quick-start"
        />
        <DocCard
          title="MCP configuration"
          description="Connect grip-mcp to Chrome on port 9222 and configure your editor."
          href="/docs/mcp/configuration"
        />
        <DocCard
          title="Chrome extension"
          description="Build and load the MV3 extension for picking and inspection."
          href="/docs/extension"
        />
        <DocCard
          title="MCP tools"
          description="Reference for snapshot, click, fill, read_logs, and more."
          href="/docs/mcp/tools"
        />
      </DocCardGrid>

      <DocH2 id="learn-more">Learn more</DocH2>
      <p>
        Explore the monorepo packages in{" "}
        <Link href="/docs/packages/core">@grip/core</Link>,{" "}
        <Link href="/docs/packages/devtools">@grip/devtools</Link>, and{" "}
        <Link href="/docs/packages/mcp-server">grip-mcp</Link>. For a minimal local setup:
      </p>
      <CodeBlock>{`pnpm install
pnpm turbo build
pnpm run build:mcp
./scripts/launch-chrome.sh 9222`}</CodeBlock>
    </DocPage>
  );
}
