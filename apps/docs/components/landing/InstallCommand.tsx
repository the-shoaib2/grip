"use client";

import { useState } from "react";

type PackageManager = "curl" | "npm" | "pnpm" | "bun" | "brew" | "paru";

const COMMANDS: Record<PackageManager, string> = {
  curl: "curl -fsSL https://grip.theshoaib.me/install | bash",
  npm: "npm install -g grip-cli",
  pnpm: "pnpm add -g grip-cli",
  bun: "bun install -g grip-cli",
  brew: "brew install grip-cli",
  paru: "paru -S grip-cli",
};

export function InstallCommand() {
  const [activeTab, setActiveTab] = useState<PackageManager>("curl");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(COMMANDS[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-12 w-full max-w-2xl mx-auto flex flex-col items-center z-10 relative">
      <div className="flex space-x-1 mb-2 bg-zinc-900/50 p-1 rounded-full border border-zinc-800 backdrop-blur-md">
        {(Object.keys(COMMANDS) as PackageManager[]).map((pm) => (
          <button
            key={pm}
            onClick={() => setActiveTab(pm)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === pm
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            {pm}
          </button>
        ))}
      </div>

      <div className="relative group w-full bg-[#0d0d0f] border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl transition-all hover:border-zinc-700">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent"></div>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2 text-zinc-400 font-mono text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
            <span className="text-zinc-600 select-none">$</span>
            <span className="text-zinc-300">{COMMANDS[activeTab]}</span>
          </div>
          
          <button
            onClick={handleCopy}
            className="ml-4 flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-lg transition-colors border border-zinc-700"
            aria-label="Copy command"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
