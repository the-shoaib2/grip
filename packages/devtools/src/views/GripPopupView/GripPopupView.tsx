import { useEffect, useState } from "preact/hooks";
import {
  GripIcon,
  GripSessionToolbar,
  PickErrorBanner,
  PickHistoryList,
  Tooltip,
} from "../../components";
import { usePickHistory } from "../../hooks/usePickHistory";
import { useStartPicker } from "../../hooks/useStartPicker";
import { useGripRuntime } from "../../runtime/context";

export function GripPopupView() {
  const runtime = useGripRuntime();
  const [mcpOk, setMcpOk] = useState(false);
  const { history, activePick, newSession, selectPick } = usePickHistory(runtime);
  const { pickError, startPicker } = useStartPicker(runtime);

  useEffect(() => {
    void runtime.checkMcp().then((r) => setMcpOk(r.ok));
  }, [runtime]);

  const handlePick = () => {
    void startPicker({ closeOnSuccess: true });
  };

  const openPanel = () => {
    void runtime
      .sendMessage({ type: "TOGGLE_GRIP_TRAY" })
      .catch(() => {
        /* ignore */
      })
      .finally(() => runtime.closeWindow?.());
  };

  return (
    <div className="grip-popup">
      <header className="grip-popup-header">
        <div className="grip-popup-brand">
          <GripIcon size={22} />
          <span className="grip-popup-title">Grip</span>
        </div>
        <Tooltip text={mcpOk ? "MCP connected on :9222" : "Chrome debug port not found"}>
          <span className={`grip-chip ${mcpOk ? "grip-chip-ok" : "grip-chip-warn"}`}>
            {mcpOk ? "MCP" : "—"}
          </span>
        </Tooltip>
      </header>

      <GripSessionToolbar
        variant="popup"
        onPick={handlePick}
        onOpenPanel={openPanel}
        onNewSession={() => void newSession()}
      />

      {pickError ? <PickErrorBanner message={pickError} onRetry={handlePick} /> : null}

      <div className="grip-popup-history">
        <PickHistoryList
          history={history}
          activeId={activePick?.id}
          onSelect={selectPick}
        />
      </div>
    </div>
  );
}
