import Link from "next/link";
import { DocCard, DocCardGrid } from "@components/docs/DocCard";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "what-is-grip", title: "What is Grip?", level: 2 as const },
  { id: "how-it-works", title: "How it works", level: 2 as const },
  { id: "what-you-can-do", title: "What you can do", level: 2 as const },
  { id: "who-its-for", title: "Who it's for", level: 2 as const },
  { id: "start-building", title: "Where to go next", level: 2 as const },
];

export default function IntroPage() {
  return (
    <DocPage
      title="Introduction to Grip"
      description="Grip is a powerful, standalone CLI that connects your AI assistants to live web browsers through the Model Context Protocol (MCP)."
      toc={toc}
    >
      <DocH2 id="what-is-grip">What is Grip?</DocH2>
      <p>
        Grip is an open-source bridge between artificial intelligence and the web. By running as a lightweight background daemon, the Grip CLI exposes your live browser session—including the DOM tree, accessibility data, and interactive capabilities—to AI IDEs and agents.
      </p>
      <p>
        Instead of AI hallucinating web layouts or being unable to interact with your local development server, Grip gives them precise, structured access to see, click, type, and evaluate JavaScript exactly as a human would.
      </p>

      <DocH2 id="how-it-works">How it works</DocH2>
      <p>
        Grip acts as a translation layer for the standard <strong>Model Context Protocol (MCP)</strong> used by AI tools to interact with your web browser.
      </p>
      <div className="my-6 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900/50 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center">
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex-1 w-full text-zinc-300 font-medium">
          AI Assistant
        </div>
        <div className="text-zinc-500 font-mono text-sm flex flex-col items-center">
          <span className="hidden md:block">MCP</span>
          <span className="hidden md:block text-xl">⟷</span>
          <span className="md:hidden text-xl">↕</span>
          <span className="md:hidden mt-1">MCP</span>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex-1 w-full text-zinc-300 font-medium">
          Grip Daemon
        </div>
        <div className="text-zinc-500 font-mono text-sm flex flex-col items-center">
          <span className="hidden md:block">CDP</span>
          <span className="hidden md:block text-xl">⟷</span>
          <span className="md:hidden text-xl">↕</span>
          <span className="md:hidden mt-1">CDP</span>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex-1 w-full text-zinc-300 font-medium">
          Browser
        </div>
      </div>
      <p>
        When you launch Grip, it connects to a debugging port on your browser. Your AI IDE then spawns the Grip CLI as a subprocess to execute tool calls (like "Click the Submit button" or "Read this page"). Grip executes the action via CDP and streams the result back to the AI.
      </p>

      <DocH2 id="what-you-can-do">What you can do</DocH2>
      <ul>
        <li>
          <strong>AI Web Browsing</strong> — Let your AI assistant read live documentation, API references, or StackOverflow directly from your browser.
        </li>
        <li>
          <strong>Visual Debugging</strong> — Ask your AI to inspect the DOM, read console logs, or analyze network requests on your local development server.
        </li>
        <li>
          <strong>Automated Testing</strong> — Instruct your AI to navigate through a checkout flow or test a form submission just by describing the steps.
        </li>
        <li>
          <strong>Universal Support</strong> — Works entirely out-of-the-box on Mac, Windows, and Linux with any Chromium-based browser. No Node.js required.
        </li>
      </ul>

      <DocH2 id="who-its-for">Who it&apos;s for</DocH2>
      <DocH3 id="developers">Developers</DocH3>
      <p>
        If you use AI-powered coding tools, Grip supercharges them by granting them vision into your actual browser. You no longer need to copy-paste HTML snippets or console errors; just ask your AI to look at the page.
      </p>
      <DocH3 id="ai-agents">AI Apps &amp; Agents</DocH3>
      <p>
        Grip provides a clean, standardized MCP interface for programmatic browser automation. It automatically parses complex DOMs into clean, token-efficient interactive accessibility trees (AXTrees) optimized for Large Language Models.
      </p>

      <DocH2 id="start-building">Where to go next</DocH2>
      <p>Ready to give your AI access to the web? Start with the quick start guide.</p>
      <DocCardGrid>
        <DocCard
          title="Quick start"
          description="Install the standalone CLI and connect your AI tool in seconds."
          href="/docs/getting-started/quick-start"
        />
        <DocCard
          title="MCP configuration"
          description="Detailed manual setup guides for configuring your AI tools."
          href="/docs/mcp/configuration"
        />
        <DocCard
          title="Tools reference"
          description="Learn about the specific MCP tools Grip exposes (snapshot, click, evaluate)."
          href="/docs/mcp/tools"
        />
        <DocCard
          title="CLI Package"
          description="Explore the available commands in the interactive Grip shell."
          href="/docs/packages/cli"
        />
      </DocCardGrid>
    </DocPage>
  );
}
