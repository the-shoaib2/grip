import { formatAllMcpPrompts, formatMcpPrompt, type StoredPick } from "@grip/core";
import { CopyButton } from "../CopyButton";
import { ElementTagBadge } from "../ElementTagBadge";
import { TrashIcon } from "../icons";
import { SessionLabel } from "../SessionLabel";
import { Tooltip } from "../Tooltip";

interface PickHistoryListProps {
  history: StoredPick[];
  activeId?: string;
  activeSessionId?: string | null;
  onSelect: (pick: StoredPick) => void;
  onDeletePick?: (pick: StoredPick) => void;
  /** Minimal switcher rows — no session header or element badges. */
  compact?: boolean;
}

function PickDeleteButton({
  pick,
  onDeletePick,
  label,
}: {
  pick: StoredPick;
  onDeletePick: (pick: StoredPick) => void;
  label: string;
}) {
  return (
    <Tooltip text="Delete pick">
      <button
        type="button"
        className="grip-btn-icon grip-pick-delete"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onDeletePick(pick);
        }}
      >
        <TrashIcon size={12} />
      </button>
    </Tooltip>
  );
}

export function PickHistoryList({
  history,
  activeId,
  activeSessionId,
  onSelect,
  onDeletePick,
  compact = false,
}: PickHistoryListProps) {
  if (!history.length) {
    return <p className="grip-empty-state">No picks yet</p>;
  }

  if (compact) {
    if (history.length <= 1 && !onDeletePick) return null;

    return (
      <ul className="grip-pick-switcher" aria-label="Session picks">
        {history.map((pick, index) => {
          const selected = activeId === pick.id;
          return (
            <li key={pick.id} className="grip-pick-switcher-item">
              <button
                type="button"
                className={`grip-pick-switcher-btn${selected ? " grip-pick-switcher-active" : ""}`}
                aria-current={selected ? "true" : undefined}
                aria-label={`Pick ${index + 1}: ${pick.label}`}
                onClick={() => onSelect(pick)}
              >
                {index + 1}
              </button>
              {onDeletePick ? (
                <PickDeleteButton
                  pick={pick}
                  onDeletePick={onDeletePick}
                  label={`Delete pick ${index + 1}: ${pick.label}`}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    );
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
                {onDeletePick ? (
                  <PickDeleteButton
                    pick={pick}
                    onDeletePick={onDeletePick}
                    label={`Delete pick ${pick.label}`}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
