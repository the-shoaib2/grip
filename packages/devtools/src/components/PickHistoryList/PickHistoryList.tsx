import { formatAllMcpPrompts, formatMcpPrompt, type StoredPick } from "@grip/core";
import { CopyButton } from "../CopyButton";
import { ElementTagBadge } from "../ElementTagBadge";
import { SessionLabel } from "../SessionLabel";
import { Tooltip } from "../Tooltip";

interface PickHistoryListProps {
  history: StoredPick[];
  activeId?: string;
  activeSessionId?: string | null;
  onSelect: (pick: StoredPick) => void;
}

export function PickHistoryList({
  history,
  activeId,
  activeSessionId,
  onSelect,
}: PickHistoryListProps) {
  if (!history.length) {
    return <p className="grip-empty-state">No picks yet</p>;
  }

  const allText = formatAllMcpPrompts(history, {
    sessionId: activeSessionId ?? history[0]?.sessionId,
  });

  return (
    <section className="grip-pick-section">
      <div className="grip-pick-section-header">
        <SessionLabel pickCount={history.length} current />
        <CopyButton
          label="Copy all"
          text={allText}
          tooltip="Copy all session prompts"
          variant="ghost"
          size="default"
        />
      </div>
      <ul className="grip-pick-list">
        {history.map((pick) => {
          const selected = activeId === pick.id;

          return (
            <li
              key={pick.id}
              className={`grip-pick-row${selected ? " grip-pick-row-active" : ""}`}
            >
              <ElementTagBadge tagName={pick.tagName} role={pick.role} className="grip-shrink-0" />
              <Tooltip
                text={pick.comment?.trim() || `Go to ${pick.label}`}
                position="top"
                wide
                className="grip-grow"
              >
                <button
                  type="button"
                  className="grip-pick-item"
                  aria-label={`Go to ${pick.label} — ${pick.css}`}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => onSelect(pick)}
                >
                  <span className="grip-pick-item-label">{pick.label}</span>
                  {pick.comment?.trim() ? (
                    <span className="grip-pick-item-comment">{pick.comment.trim()}</span>
                  ) : null}
                </button>
              </Tooltip>
              <div className="grip-pick-row-actions">
                <CopyButton
                  label="Copy"
                  text={formatMcpPrompt(pick)}
                  tooltip="Copy prompt"
                  variant="ghost"
                  size="icon"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
