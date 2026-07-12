"use client";

import { useState } from "react";
import { CodeBlock } from "@components/docs/CodeBlock";

type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

const commands: Record<PackageManager, string> = {
  npm: "npm install grip-dev",
  pnpm: "pnpm add grip-dev",
  yarn: "yarn add grip-dev",
  bun: "bun add grip-dev",
};

export function GripDevInstallTabs() {
  const [activeTab, setActiveTab] = useState<PackageManager>("npm");
  const pms: PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

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
