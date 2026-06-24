import { MousePointerClickIcon, PlusIcon } from "../icons";
import { Tooltip } from "../Tooltip";

export interface GripSessionToolbarProps {
  variant: "popup" | "compact";
  pickActive?: boolean;
  historyView?: boolean;
  onPick: () => void;
  onToggleHistoryView: () => void;
  onNewSession: () => void;
}

export function GripSessionToolbar({
  variant,
  pickActive = false,
  historyView: _historyView = false,
  onPick,
  onToggleHistoryView: _onToggleHistoryView,
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
          className={`grip-btn-ghost grip-btn-toolbar grip-btn-toolbar-pick${pickActive ? " grip-btn-toolbar-active" : ""}`}
          aria-pressed={pickActive ? "true" : "false"}
          onClick={onPick}
        >
          <MousePointerClickIcon size={16} />
          <span className="grip-btn-toolbar-pick-label">Pick</span>
          <span className="grip-btn-toolbar-pick-shine" aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}
