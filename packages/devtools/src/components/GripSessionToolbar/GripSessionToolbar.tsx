import { HistoryIcon, MousePointerClickIcon, PlusIcon } from "../icons";
import { Tooltip } from "../Tooltip";

export interface GripSessionToolbarProps {
  variant: "popup" | "compact";
  pickActive?: boolean;
  onPick: () => void;
  onOpenPanel?: () => void;
  onNewSession: () => void;
}

export function GripSessionToolbar({
  variant,
  pickActive = false,
  onPick,
  onOpenPanel,
  onNewSession,
}: GripSessionToolbarProps) {
  if (variant === "compact") {
    return (
      <Tooltip text="New session — clear current session picks for this page">
        <button
          type="button"
          className="grip-btn-ghost grip-btn-toolbar"
          onClick={onNewSession}
        >
          <PlusIcon size={16} />
          <span>New</span>
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
      <div className="grip-popup-toolbar-actions">
        <Tooltip text="New session — clear current session picks for this page">
          <button
            type="button"
            className="grip-btn-ghost grip-btn-toolbar"
            onClick={onNewSession}
          >
            <PlusIcon size={16} />
            <span>New</span>
          </button>
        </Tooltip>
        {onOpenPanel && (
          <Tooltip text="Open in-page Grip panel">
            <button
              type="button"
              className="grip-btn-ghost grip-btn-toolbar grip-btn-toolbar-icon"
              aria-label="Open in-page Grip panel"
              onClick={onOpenPanel}
            >
              <HistoryIcon size={16} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
