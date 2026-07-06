"use client";

import { useState } from "react";

const TABS = [
  {
    id: "install",
    label: "1. Install & Build",
    title: "Bootstrap the monorepo dependencies and CLI tools",
    command: "pnpm install && pnpm run build:mcp",
    output: `> grip@ dev /Users/ratulhasan/Desktop/grip
> pnpm install
✔ dependencies updated in 2.3s

> pnpm run build:mcp
✔ bootstrapping Go toolchain...
✔ grip-mcp server compiled successfully to: bin/grip-mcp`
  },
  {
    id: "chrome",
    label: "2. Launch Chrome",
    title: "Start Google Chrome with remote debugging protocol active",
    command: "./scripts/launch-chrome.sh 9222",
    output: `> starting debug instance...
> port: 9222
> profile: user-data-dir=chrome-debug-profile
> DevTools listening on ws://127.0.0.1:9222/devtools/browser/9cf96b5b...`
  },
  {
    id: "mcp",
    label: "3. Configure IDE Client",
    title: "Connect grip-mcp in your Model Context Protocol configuration",
    command: "cat .cursor/mcp.json",
    output: `{
  "mcpServers": {
    "grip": {
      "command": "/Users/ratulhasan/Desktop/grip/bin/grip-mcp",
      "args": ["--port", "9222"]
    }
  }
}`
  },
  {
    id: "tools",
    label: "4. Run MCP Tools",
    title: "AI agents invoke grip-mcp tools to inspect & act on the page",
    command: "grip-mcp --log-level debug",
    output: `[info] MCP server started listening on stdio
[debug] tool call received: "snapshot" (args: { tabId: 1 })
[debug] fetched 142 DOM nodes, serializing to a11y JSON tree
[debug] tool call received: "highlight" (args: { selector: "#submit-btn" })
[debug] tool call received: "click" (args: { selector: "#submit-btn" })`
  }
];

export function TerminalDemo() {
  const [activeTab, setActiveTab] = useState("install");
  const tabData = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section className="landing-terminal-section">
      <div className="landing-section-header">
        <h2 className="landing-section-title">Development Workflow</h2>
        <p className="landing-section-desc">
          From workspace bootstrap to MCP tools running, manage your browser environment easily.
        </p>
      </div>

      <div className="landing-terminal-tabs" role="tablist" aria-label="Terminal Workflow Steps">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`landing-terminal-tab-btn ${
              activeTab === tab.id ? "landing-terminal-tab-btn-active" : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`panel-${tabData.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${tabData.id}`}
        className="landing-terminal-mockup"
      >
        <div className="landing-terminal-header">
          <div className="landing-terminal-dots">
            <span className="landing-terminal-dot landing-terminal-dot-red" />
            <span className="landing-terminal-dot landing-terminal-dot-yellow" />
            <span className="landing-terminal-dot landing-terminal-dot-green" />
          </div>
          <span className="landing-terminal-title">{tabData.title}</span>
        </div>
        <div className="landing-terminal-body">
          <span className="text-zinc-500" aria-hidden="true">$ </span>
          <span className="text-emerald-400 font-bold">{tabData.command}</span>
          <pre className="mt-2 text-zinc-300 font-mono whitespace-pre-wrap">{tabData.output}</pre>
        </div>
      </div>
    </section>
  );
}
