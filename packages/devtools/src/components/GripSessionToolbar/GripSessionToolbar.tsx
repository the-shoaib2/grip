import { HistoryIcon, MousePointerClickIcon, PlusIcon } from "../icons";
import { Tooltip } from "../Tooltip";

export interface GripSessionToolbarProps {
  variant: "popup" | "compact";
  onPick: () => void;
  onOpenPanel?: () => void;
  onNewSession: () => void;
}

export function GripSessionToolbar({
  variant,
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
      <Tooltip text="Pick any element on the page">
        <button
          type="button"
          className="grip-btn-ghost grip-btn-toolbar"
          onClick={onPick}
        >
          <MousePointerClickIcon size={16} />
          <span>Pick</span>
        </button>
      </Tooltip>
      <div className="grip-popup-toolbar-actions">
        {onOpenPanel && (
          <Tooltip text="Open in-page Grip panel">
            <button
              type="button"
              className="grip-btn-ghost grip-btn-toolbar"
              onClick={onOpenPanel}
            >
              <HistoryIcon size={16} />
              <span>Panel</span>
            </button>
          </Tooltip>
        )}
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
      </div>
    </div>
  );
}
