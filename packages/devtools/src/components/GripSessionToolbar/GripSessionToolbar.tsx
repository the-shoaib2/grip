import { MousePointerClickIcon, PlusIcon, GitIcon } from "@devtools/components/icons";
import { Tooltip } from "@devtools/components/Tooltip";

export interface GripSessionToolbarProps {
  variant: "popup" | "compact";
  pickActive?: boolean;
  historyView?: boolean;
  gitView?: boolean;
  onPick: () => void;
  onToggleHistoryView: () => void;
  onNewSession: () => void;
  onToggleGitView?: () => void;
}

export function GripSessionToolbar({
  variant,
  pickActive = false,
  gitView = false,
  onPick,
  onNewSession,
  onToggleGitView,
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
    <div className="grip-popup-toolbar" style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
      <Tooltip text={pickActive ? "Stop picking" : "Pick any element on the page"}>
        <button
          type="button"
          className={`grip-btn-ghost grip-btn-toolbar grip-btn-toolbar-pick${pickActive ? " grip-btn-toolbar-active" : ""}`}
          aria-pressed={pickActive ? "true" : "false"}
          onClick={onPick}
          style={{ flex: 1 }}
        >
          <MousePointerClickIcon size={16} />
          <span className="grip-btn-toolbar-pick-label">Pick</span>
          <span className="grip-btn-toolbar-pick-shine" aria-hidden="true" />
        </button>
      </Tooltip>
      {onToggleGitView ? (
        <Tooltip text={gitView ? "Hide source control" : "Show source control"}>
          <button
            type="button"
            className={`grip-btn-ghost grip-btn-toolbar${gitView ? " grip-btn-toolbar-active" : ""}`}
            aria-label="Source control"
            aria-pressed={gitView ? "true" : "false"}
            onClick={onToggleGitView}
            style={{ flex: 1 }}
          >
            <GitIcon size={16} />
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}
