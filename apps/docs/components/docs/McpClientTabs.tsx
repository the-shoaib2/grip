"use client";

import { useEffect, useRef, useState } from "react";
import type { McpClientGuide } from "@lib/mcp-clients";
import { mcpCliClients, mcpIdeClients } from "@lib/mcp-clients";
import { McpClientIcon } from "@components/docs/McpClientIcon";
import { McpClientSetup } from "@components/docs/McpClientSetup";

type ClientCategory = "ide" | "cli";

const categories: { id: ClientCategory; label: string; clients: McpClientGuide[] }[] = [
  { id: "ide", label: "IDEs & editors", clients: mcpIdeClients },
  { id: "cli", label: "CLI & terminal", clients: mcpCliClients },
];

export function McpClientTabs() {
  const [category, setCategory] = useState<ClientCategory>("ide");
  const activeGroup = categories.find((c) => c.id === category) ?? categories[0];
  const [selectedId, setSelectedId] = useState(activeGroup.clients[0]?.id ?? "");
  const clientTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selected =
    activeGroup.clients.find((c) => c.id === selectedId) ?? activeGroup.clients[0];

  const switchCategory = (next: ClientCategory) => {
    setCategory(next);
    const group = categories.find((c) => c.id === next);
    setSelectedId(group?.clients[0]?.id ?? "");
  };

  useEffect(() => {
    clientTabRefs.current[selectedId]?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [selectedId, category]);

  return (
    <div className="doc-mcp-tabs">
      <div className="doc-mcp-tabs-category" role="tablist" aria-label="Client type">
        {categories.map((group) => (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={category === group.id}
            className={
              category === group.id
                ? "doc-mcp-tab doc-mcp-tab-category doc-mcp-tab-active"
                : "doc-mcp-tab doc-mcp-tab-category"
            }
            onClick={() => switchCategory(group.id)}
          >
            {group.label}
            <span className="doc-mcp-tab-count">{group.clients.length}</span>
          </button>
        ))}
      </div>

      <div
        className="doc-mcp-tabs-clients doc-scrollbar"
        role="tablist"
        aria-label={`${activeGroup.label} clients`}
      >
        {activeGroup.clients.map((client) => (
          <button
            key={client.id}
            ref={(el) => {
              clientTabRefs.current[client.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected?.id === client.id}
            className={
              selected?.id === client.id
                ? "doc-mcp-tab doc-mcp-tab-client doc-mcp-tab-active"
                : "doc-mcp-tab doc-mcp-tab-client"
            }
            onClick={() => setSelectedId(client.id)}
          >
            <McpClientIcon client={client} size={16} />
            <span>{client.name}</span>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="doc-mcp-tabs-panel" role="tabpanel">
          <McpClientSetup client={selected} showHeading={false} />
        </div>
      ) : null}
    </div>
  );
}
