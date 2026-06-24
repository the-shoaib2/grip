import type { SessionPickGroup } from "@grip/core";
import { formatSessionTabTitle } from "../../lib/sessionLabel";
import { CloseIcon, HistoryIcon, PlusIcon } from "../icons";
import { Tooltip } from "../Tooltip";

export interface SessionTabBarProps {
  groups: SessionPickGroup[];
  activeSessionId?: string | null;
  historyView?: boolean;
  onSelectSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
  onNewSession: () => void;
  onToggleHistoryView: () => void;
}

/** Include the active empty session even before it has saved picks. */
function buildTabs(
  groups: SessionPickGroup[],
  activeSessionId?: string | null,
): SessionPickGroup[] {
  if (!activeSessionId || groups.some((group) => group.sessionId === activeSessionId)) {
    return groups;
  }
  return [...groups, { sessionId: activeSessionId, picks: [] }];
}

export function SessionTabBar({
  groups,
  activeSessionId,
  historyView = false,
  onSelectSession,
  onCloseSession,
  onNewSession,
  onToggleHistoryView,
}: SessionTabBarProps) {
  const tabs = buildTabs(groups, activeSessionId);

  return (
    <div className="grip-session-tab-bar">
      <div className="grip-session-tab-scroll" role="tablist" aria-label="Sessions">
        {tabs.map((group) => {
          const active = group.sessionId === activeSessionId && !historyView;
          const title = formatSessionTabTitle(group.picks);
          const canClose = tabs.length > 1;

          return (
            <div
              key={group.sessionId}
              data-session-id={group.sessionId}
              className={`grip-session-tab${active ? " grip-session-tab-active" : ""}`}
              role="presentation"
            >
              <button
                type="button"
                className="grip-session-tab-main"
                role="tab"
                aria-selected={active ? "true" : "false"}
                aria-label={title}
                onClick={() => onSelectSession(group.sessionId)}
              >
                <span className="grip-session-tab-icon" aria-hidden="true" />
                <span className="grip-session-tab-label">{title}</span>
              </button>
              {canClose ? (
                <button
                  type="button"
                  className="grip-session-tab-close"
                  aria-label={`Close ${title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseSession(group.sessionId);
                  }}
                >
                  <CloseIcon size={12} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="grip-session-tab-actions">
        <Tooltip text="New session">
          <button
            type="button"
            className="grip-btn-ghost grip-btn-toolbar grip-btn-toolbar-icon"
            aria-label="New session"
            onClick={onNewSession}
          >
            <PlusIcon size={16} />
          </button>
        </Tooltip>
        <Tooltip text={historyView ? "Current session" : "All sessions"}>
          <button
            type="button"
            className={`grip-btn-ghost grip-btn-toolbar grip-btn-toolbar-icon${historyView ? " grip-btn-toolbar-active" : ""}`}
            aria-label={historyView ? "Show current session" : "Show all sessions"}
            aria-pressed={historyView ? "true" : "false"}
            onClick={onToggleHistoryView}
          >
            <HistoryIcon size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
