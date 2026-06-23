import { formatAllMcpPrompts, type SessionPickGroup } from "@grip/core";
import { formatSessionGroupTitle } from "../../lib/sessionLabel";
import { CopyButton } from "../CopyButton";
import { TrashIcon } from "../icons";
import { Tooltip } from "../Tooltip";

export interface SessionHistoryListProps {
  groups: SessionPickGroup[];
  activeSessionId?: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function SessionHistoryList({
  groups,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: SessionHistoryListProps) {
  if (!groups.length) {
    return <p className="grip-empty-state">No sessions on this page</p>;
  }

  return (
    <section className="grip-session-history">
      <div className="grip-pick-section-header">
        <span className="grip-label grip-label-plain">All sessions</span>
      </div>
      <ul className="grip-session-list">
        {groups.map((group) => {
          const isActive = group.sessionId === activeSessionId;
          const preview = group.picks
            .map((pick) => pick.label)
            .slice(0, 3)
            .join(" · ");
          const copyText = formatAllMcpPrompts(group.picks, {
            sessionId: group.sessionId,
          });

          return (
            <li
              key={group.sessionId}
              className={`grip-session-row${isActive ? " grip-session-row-active" : ""}`}
            >
              <Tooltip
                text={isActive ? "Current session — click to open" : "Open this session"}
                position="top"
                wide
                className="grip-grow"
              >
                <button
                  type="button"
                  className="grip-session-row-main"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelectSession(group.sessionId)}
                >
                  <span className="grip-session-row-title">
                    {formatSessionGroupTitle(group.picks, isActive)}
                  </span>
                  <span className="grip-session-row-meta">{preview}</span>
                </button>
              </Tooltip>
              <div className="grip-session-row-actions">
                <CopyButton
                  label="Copy"
                  text={copyText}
                  tooltip="Copy session prompts"
                  variant="ghost"
                  size="icon"
                />
                {onDeleteSession ? (
                  <Tooltip text="Delete session">
                    <button
                      type="button"
                      className="grip-btn-icon grip-pick-delete"
                      aria-label={`Delete session ${formatSessionGroupTitle(group.picks, isActive)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(group.sessionId);
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
