"use client";

import { useState } from "react";

const TABS = [
  {
    id: "install",
    label: "1. Install",
    title: "Configure local packages and server bin",
    command: "pnpm install && pnpm run build:mcp",
    output: `> grip-dev@0.1.0 build
> tsup && tsc -p tsconfig.dts.json

CLI Building entry: src/index.ts, src/mcp/index.ts
✔ compiled successfully to bin/grip-mcp`
  },
  {
    id: "chrome",
    label: "2. Launch Chrome",
    title: "Expose CDP debug port",
    command: "./scripts/launch-chrome.sh 9222",
    output: `> starting debug instance...
> DevTools listening on ws://127.0.0.1:9222/devtools/browser/9cf96b5b...`
  },
  {
    id: "mcp",
    label: "3. Bind MCP",
    title: "Bind grip-mcp to developer clients",
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
    label: "4. Run Tools",
    title: "AI agents invoke tools via CDP",
    command: "grip-mcp --log-level debug",
    output: `[info] MCP server active
[debug] call received: "snapshot" (tabId: 1)
[debug] fetched 142 DOM nodes, serializing tree
[debug] call received: "click" (selector: "#submit-btn")`
  }
];

export function TerminalDemo() {
  const [activeTab, setActiveTab] = useState("install");
  const tabData = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section className="w-full py-16 px-6 border-b border-zinc-900 bg-zinc-950/10">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="w-full mb-10 text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Quick Start Workflow
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            Expose standard Chrome DevTools debugger ports, connect your MCP server, and trigger browser queries.
          </p>
        </div>

        {/* Tab Buttons bar with crisp border */}
        <div className="w-full max-w-4xl flex border border-zinc-800 bg-zinc-900/10 rounded-lg p-1.5 gap-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Terminal Card */}
        <div className="w-full max-w-4xl border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/80 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 border-b border-zinc-800/80">
            {/* Terminal Dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            {/* Title / Description */}
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
              {tabData.title}
            </span>
            <div className="w-10" />
          </div>
          {/* Terminal Code Body */}
          <div className="p-5 font-mono text-[13px] leading-relaxed text-zinc-300 overflow-x-auto min-h-[160px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-zinc-500 select-none">$</span>
              <span className="text-emerald-400 font-semibold">{tabData.command}</span>
            </div>
            <pre className="text-zinc-400 whitespace-pre-wrap">{tabData.output}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
