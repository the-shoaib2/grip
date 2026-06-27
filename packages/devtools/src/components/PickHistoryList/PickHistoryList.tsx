import {
  formatAllMcpPrompts,
  formatMcpPrompt,
  formatStoredPickCommentForDisplay,
  type StoredPick,
} from "@grip/core";
import { CopyButton } from "@devtools/components/CopyButton";
import { SessionLabel } from "@devtools/components/SessionLabel";
import { Tooltip } from "@devtools/components/Tooltip";

interface PickHistoryListProps {
  history: StoredPick[];
  activeId?: string;
  activeSessionId?: string | null;
  onSelect: (pick: StoredPick) => void;
  /** Minimal switcher rows — no session header or element badges. */
  compact?: boolean;
}

export function PickHistoryList({
  history,
  activeId,
  activeSessionId,
  onSelect,
  compact = false,
}: PickHistoryListProps) {
  if (!history.length) {
    return <p className="grip-empty-state">No picks yet</p>;
  }

  if (compact) {
    if (history.length <= 1) return null;

    return (
      <ul className="grip-pick-switcher" aria-label="Session picks">
        {history.map((pick, index) => {
          const selected = activeId === pick.id;
          return (
            <li key={pick.id}>
              <button
                type="button"
                className={`grip-pick-switcher-btn${selected ? " grip-pick-switcher-active" : ""}`}
                aria-current={selected ? "true" : undefined}
                aria-label={`Pick ${index + 1}: ${pick.label}`}
                onClick={() => onSelect(pick)}
              >
                {index + 1}
              </button>
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
          const commentPreview = formatStoredPickCommentForDisplay(pick, history);

          return (
            <li
              key={pick.id}
              className={`grip-pick-row${selected ? " grip-pick-row-active" : ""}`}
            >

              <Tooltip
                text={commentPreview || `Go to ${pick.label}`}
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
                  {commentPreview ? (
                    <span className="grip-pick-item-comment">{commentPreview}</span>
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
