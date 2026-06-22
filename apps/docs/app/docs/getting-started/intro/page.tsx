import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocCard, DocCardGrid } from "@components/docs/DocCard";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "what-is-grip", title: "What is Grip?", level: 2 as const },
  { id: "what-you-can-do", title: "What you can do", level: 2 as const },
  { id: "who-its-for", title: "Who it's for", level: 2 as const },
  { id: "start-building", title: "Where to go next", level: 2 as const },
  { id: "learn-more", title: "Minimal setup", level: 2 as const },
];

export default function IntroPage() {
  return (
    <DocPage
      title="What is Grip?"
      description="Grip helps you pick elements on any web page, inspect accessibility data, and connect your browser to AI tools through MCP."
      toc={toc}
    >
      <DocH2 id="what-is-grip">What is Grip?</DocH2>
      <p>
        Grip is an open-source toolkit for working with live web pages. You get a Chrome extension
        for visual picking, a shared UI across popup / DevTools / floating panel, and an MCP server
        so AI assistants can snapshot, click, and debug pages in your real browser.
      </p>
      <p>
        Think of it as a bridge: the extension captures what you see on the page;{" "}
        <code>grip-mcp</code> lets tools like Cursor, Claude Code, or Gemini CLI act on that same
        browser session.
      </p>

      <DocH2 id="what-you-can-do">What you can do</DocH2>
      <ul>
        <li>
          <strong>Pick any element</strong> — hover, click, and get CSS, XPath, role, and text in
          one place.
        </li>
        <li>
          <strong>Share context with AI</strong> — copy MCP-ready prompts or let an agent call{" "}
          <code>snapshot</code> and <code>click</code> directly.
        </li>
        <li>
          <strong>Debug faster</strong> — read console logs and network traffic next to your picks.
        </li>
        <li>
          <strong>Use one UI everywhere</strong> — popup, DevTools panel, and in-page floating tray
          share the same layout and pick history.
        </li>
      </ul>

      <DocH2 id="who-its-for">Who it&apos;s for</DocH2>
      <DocH3 id="developers">Developers</DocH3>
      <p>
        Stop guessing selectors. Pick once, copy a stable path, and move on. Grip is built for
        day-to-day front-end and automation work — not just demos.
      </p>
      <DocH3 id="ai-agents">AI apps &amp; agents</DocH3>
      <p>
        Through{" "}
        <a href="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noreferrer">
          Model Context Protocol (MCP)
        </a>
        , agents get structured browser access: accessibility refs, clicks, fills, logs, and network
        data — all tied to the page you already have open.
      </p>
      <DocH3 id="end-users">Teams</DocH3>
      <p>
        Everyone on the team sees the same pick history and session UI, whether they open Grip from
        the toolbar, DevTools, or the floating button on the page.
      </p>

      <DocH2 id="start-building">Where to go next</DocH2>
      <p>New here? Start with the quick start, then wire up MCP for your editor or CLI.</p>
      <DocCardGrid>
        <DocCard
          title="Quick start"
          description="Install, build, launch Chrome, and load the extension in a few minutes."
          href="/docs/getting-started/quick-start"
        />
        <DocCard
          title="MCP configuration"
          description="Set up grip-mcp for Cursor, VS Code, Claude Code, Gemini CLI, OpenCode, and more."
          href="/docs/mcp/configuration"
        />
        <DocCard
          title="Chrome extension"
          description="Build and load the extension — popup, DevTools panel, and floating tray."
          href="/docs/extension"
        />
        <DocCard
          title="MCP tools"
          description="What each tool does and a simple workflow agents should follow."
          href="/docs/mcp/tools"
        />
      </DocCardGrid>

      <DocH2 id="learn-more">Minimal setup</DocH2>
      <p>If you already have the repo cloned, this is the shortest path to a working stack:</p>
      <CodeBlock>{`pnpm install
pnpm turbo build
pnpm run build:mcp
./scripts/launch-chrome.sh 9222`}</CodeBlock>
      <DocTip>
        After Chrome is running, open the Grip extension and check the MCP chip in the header —
        green means your browser is reachable on port 9222.
      </DocTip>
      <p>
        Want package-level detail? See{" "}
        <Link href="/docs/packages/core">@grip/core</Link>,{" "}
        <Link href="/docs/packages/devtools">@grip/devtools</Link>, and{" "}
        <Link href="/docs/packages/mcp-server">grip-mcp</Link>.
      </p>
    </DocPage>
  );
}
