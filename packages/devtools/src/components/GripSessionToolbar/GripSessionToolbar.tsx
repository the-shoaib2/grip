import { HistoryIcon, MousePointerClickIcon, PlusIcon } from "../icons";
import { SessionLabel } from "../SessionLabel";
import { Tooltip } from "../Tooltip";

export interface GripSessionToolbarProps {
  variant: "popup" | "compact";
  pickActive?: boolean;
  historyOpen?: boolean;
  sessionCount?: number;
  onPick: () => void;
  onToggleHistory: () => void;
  onNewSession: () => void;
}

export function GripSessionToolbar({
  variant,
  pickActive = false,
  historyOpen = true,
  sessionCount = 0,
  onPick,
  onToggleHistory,
  onNewSession,
}: GripSessionToolbarProps) {
  if (variant === "compact") {
    return (
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
    );
  }

  return (
    <div className="grip-popup-toolbar">
      <Tooltip text={pickActive ? "Stop picking" : "Pick any element on the page"}>
        <button
          type="button"
          className={`grip-btn-ghost grip-btn-toolbar${pickActive ? " grip-btn-toolbar-active" : ""}`}
          aria-pressed={pickActive ? "true" : "false"}
          onClick={onPick}
        >
          <MousePointerClickIcon size={16} />
          <span>Pick</span>
        </button>
      </Tooltip>
      <div className="grip-popup-toolbar-trail">
        {!historyOpen && sessionCount > 0 ? (
          <SessionLabel pickCount={sessionCount} className="grip-session-toolbar-label" />
        ) : null}
        <div className="grip-popup-toolbar-actions">
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
          <Tooltip text={historyOpen ? "Hide session picks" : "Show session picks"}>
            <button
              type="button"
              className={`grip-btn-ghost grip-btn-toolbar grip-btn-toolbar-icon${historyOpen ? " grip-btn-toolbar-muted-active" : ""}`}
              aria-label={historyOpen ? "Hide session picks" : "Show session picks"}
              aria-pressed={historyOpen ? "true" : "false"}
              onClick={onToggleHistory}
            >
              <HistoryIcon size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
