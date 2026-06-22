import { useEffect, useState } from "preact/hooks";
import {
  GripIcon,
  GripSessionToolbar,
  PickHistoryList,
  Tooltip,
} from "../../components";
import { usePickHistory } from "../../hooks/usePickHistory";
import { gripUserError } from "../../lib/errors";
import { useGripRuntime } from "../../runtime/context";

export function GripPopupView() {
  const runtime = useGripRuntime();
  const [mcpOk, setMcpOk] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const { history, activePick, newSession, selectPick } = usePickHistory(runtime);

  useEffect(() => {
    void runtime.checkMcp().then((r) => setMcpOk(r.ok));
  }, [runtime]);

  const startPicker = () => {
    setPickError(null);
    void runtime
      .sendMessage<{ ok?: boolean; error?: string }>({ type: "START_PICKER" })
      .then((res) => {
        if (res?.ok === false) {
          setPickError(gripUserError(res.error));
          return;
        }
        runtime.closeWindow?.();
      })
      .catch((err: Error) => {
        setPickError(gripUserError(err.message));
      });
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
        onPick={startPicker}
        onOpenPanel={openPanel}
        onNewSession={() => void newSession()}
      />

      {pickError && <p className="grip-popup-error">{pickError}</p>}

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
