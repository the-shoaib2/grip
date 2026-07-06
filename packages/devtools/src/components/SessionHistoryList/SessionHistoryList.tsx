import { formatAllMcpPrompts, formatStoredPickCommentForDisplay, type SessionPickGroup, type StoredPick } from "grip-dev";
import { CopyButton, SyncButton } from "@devtools/components";
import { TrashIcon } from "@devtools/components/icons";
import { Tooltip } from "@devtools/components/Tooltip";

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
                  style={{ display: "flex", flexDirection: "column", gap: "0.375rem", width: "100%", alignItems: "stretch" }}
                >
                  {group.picks.length > 0 ? (
                    group.picks.map((pick: StoredPick) => {
                      const commentPreview = formatStoredPickCommentForDisplay(
                        pick,
                        group.picks,
                      );
                      return (
                      <div key={pick.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>

                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span className="grip-pick-item-label" style={{ fontWeight: isActive ? "500" : "normal" }}>
                            {pick.label}
                          </span>
                          {commentPreview ? (
                            <span className="grip-pick-item-comment">{commentPreview}</span>
                          ) : null}
                        </div>
                      </div>
                      );
                    })
                  ) : (
                    <span className="grip-session-row-title">Empty session</span>
                  )}
                </button>
              </Tooltip>
              <div className="grip-session-row-actions">
                <SyncButton
                  picks={group.picks}
                  label="Sync"
                  tooltip="Send to IDE"
                  variant="ghost"
                  size="icon"
                />
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
                      aria-label="Delete this context"
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
