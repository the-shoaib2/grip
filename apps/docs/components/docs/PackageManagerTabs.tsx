"use client";

import { useState } from "react";
import { CodeBlock } from "@components/docs/CodeBlock";

type PackageManager = "curl" | "npm" | "pnpm" | "bun" | "brew" | "paru";

const commands: Record<PackageManager, string> = {
  curl: "curl -fsSL https://grip.theshoaib.me/install | bash",
  npm: "npm install -g grip-cli",
  pnpm: "pnpm add -g grip-cli",
  bun: "bun install -g grip-cli",
  brew: "brew install grip-cli",
  paru: "paru -S grip-cli",
};

export function PackageManagerTabs() {
  const [activeTab, setActiveTab] = useState<PackageManager>("curl");
  const pms: PackageManager[] = ["curl", "npm", "pnpm", "bun", "brew", "paru"];

  return (
    <div className="doc-mcp-tabs mt-4 mb-6">
      <div className="doc-mcp-tabs-clients doc-scrollbar" role="tablist" aria-label="Package Managers">
        {pms.map((pm) => (
          <button
            key={pm}
            type="button"
            role="tab"
            aria-selected={activeTab === pm}
            className={
              activeTab === pm
                ? "doc-mcp-tab doc-mcp-tab-client doc-mcp-tab-active"
                : "doc-mcp-tab doc-mcp-tab-client"
            }
            onClick={() => setActiveTab(pm)}
          >
            <span>{pm}</span>
          </button>
        ))}
      </div>
      <div className="doc-mcp-tabs-panel" role="tabpanel">
        <CodeBlock>{commands[activeTab]}</CodeBlock>
      </div>
    </div>
  );
}
