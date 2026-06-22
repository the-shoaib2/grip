import { formatAllMcpPrompts, formatMcpPrompt, type StoredPick } from "@grip/core";
import { CopyButton } from "./CopyButton";

interface PickHistoryListProps {
  history: StoredPick[];
  activeId?: string;
  onSelect: (pick: StoredPick) => void;
  copyAs?: "mcp" | "css" | "xpath";
}

function pickCopyText(pick: StoredPick, copyAs: "mcp" | "css" | "xpath"): string {
  if (copyAs === "css") return pick.css;
  if (copyAs === "xpath") return pick.xpath;
  return formatMcpPrompt(pick);
}

export function PickHistoryList({
  history,
  activeId,
  onSelect,
  copyAs = "mcp",
}: PickHistoryListProps) {
  if (!history.length) {
    return (
      <p className="py-2 text-center text-[11px] text-zinc-600">No picks yet</p>
    );
  }

  const allText = formatAllMcpPrompts(history);
  const copyAllTooltip =
    copyAs === "css"
      ? "Copy all CSS selectors"
      : copyAs === "xpath"
        ? "Copy all XPath"
        : "Copy all MCP prompts";

  const allPlain =
    copyAs === "css"
      ? history.map((p) => p.css).join("\n")
      : copyAs === "xpath"
        ? history.map((p) => p.xpath).join("\n")
        : allText;

  return (
    <section className="grip-pick-section">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="grip-label">Saved on page</span>
        <CopyButton
          label="Copy all"
          text={allPlain}
          tooltip={copyAllTooltip}
          variant="ghost"
          size="default"
        />
      </div>
      <ul className="grip-pick-list">
        {history.map((pick) => {
          const selected = activeId === pick.id;
          const itemTooltip = pick.css;
          const copyTooltip =
            copyAs === "css"
              ? `Copy CSS: ${pick.label}`
              : copyAs === "xpath"
                ? `Copy XPath: ${pick.label}`
                : `Copy MCP prompt: ${pick.label}`;

          return (
            <li key={pick.id} className={`grip-pick-row ${selected ? "grip-pick-row-active" : ""}`}>
              <button
                type="button"
                className="grip-pick-item"
                title={itemTooltip}
                onClick={() => onSelect(pick)}
              >
                <span className="truncate">{pick.label}</span>
              </button>
              <CopyButton
                label="Copy"
                text={pickCopyText(pick, copyAs)}
                tooltip={copyTooltip}
                variant="ghost"
                size="icon"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
