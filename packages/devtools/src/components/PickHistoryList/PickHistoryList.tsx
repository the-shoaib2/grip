import { formatAllMcpPrompts, formatMcpPrompt, type StoredPick } from "@grip/core";
import { CopyButton } from "../CopyButton";
import { ElementTagBadge } from "../ElementTagBadge";
import { TrashIcon } from "../icons";
import { SessionLabel } from "../SessionLabel";
import { Tooltip } from "../Tooltip";

interface PickHistoryListProps {
  history: StoredPick[];
  activeId?: string;
  onSelect: (pick: StoredPick) => void;
  onDelete?: (pick: StoredPick) => void;
}

export function PickHistoryList({
  history,
  activeId,
  onSelect,
  onDelete,
}: PickHistoryListProps) {
  if (!history.length) {
    return <p className="grip-empty-state">No picks yet</p>;
  }

  const allText = formatAllMcpPrompts(history);

  return (
    <section className="grip-pick-section">
      <div className="grip-pick-section-header">
        <SessionLabel pickCount={history.length} />
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
                {onDelete ? (
                  <Tooltip text="Remove from session">
                    <button
                      type="button"
                      className="grip-btn-icon grip-pick-delete"
                      aria-label={`Remove ${pick.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pick);
                      }}
                    >
                      <TrashIcon size={12} />
                    </button>
                  </Tooltip>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
