import { useEffect, useState } from "preact/hooks";
import type { LogMessagePayload, PickerElementPayload } from "@grip/core";
import {
  GripIcon,
  GripSessionToolbar,
  MinusIcon,
  PickErrorBanner,
  PickHistoryList,
  Tooltip,
} from "../../components";
import { usePickHistory } from "../../hooks/usePickHistory";
import { useStartPicker } from "../../hooks/useStartPicker";
import { useGripStore } from "../../store/gripStore";
import { useGripRuntime } from "../../runtime/context";

export interface GripMainViewProps {
  className?: string;
  closeOnPickSuccess?: boolean;
  onMinimize?: () => void;
  onOpenPanel?: () => void;
  syncPanelReady?: boolean;
}

export function GripMainView({
  className = "grip-popup",
  closeOnPickSuccess = false,
  onMinimize,
  onOpenPanel,
  syncPanelReady = false,
}: GripMainViewProps) {
  const runtime = useGripRuntime();
  const setLastPick = useGripStore((s) => s.setLastPick);
  const addLog = useGripStore((s) => s.addLog);
  const clearLogs = useGripStore((s) => s.clearLogs);
  const [mcpOk, setMcpOk] = useState(false);
  const { history, activePick, newSession, selectPick } = usePickHistory(runtime);
  const { pickError, startPicker } = useStartPicker(runtime);

  useEffect(() => {
    void runtime.checkMcp().then((r) => setMcpOk(r.ok));
  }, [runtime]);

  useEffect(() => {
    if (!syncPanelReady) return;

    void runtime
      .sendMessage<{
        lastPick?: PickerElementPayload;
        logs?: LogMessagePayload[];
      }>({ type: "PANEL_READY" })
      .then((data) => {
        if (data?.lastPick) setLastPick(data.lastPick);
        if (data?.logs?.length) {
          clearLogs();
          for (const entry of data.logs) addLog(entry);
        }
      })
      .catch(() => {
        /* panel may not be ready */
      });

    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === "session" && changes.lastPick?.newValue) {
        setLastPick(changes.lastPick.newValue as PickerElementPayload);
      }
      if (area === "session" && changes.logs?.newValue) {
        useGripStore.setState({ logs: changes.logs.newValue as LogMessagePayload[] });
      }
    };

    const unsub = runtime.onStorageChanged(onStorage);
    return unsub;
  }, [runtime, setLastPick, addLog, clearLogs, syncPanelReady]);

  const handlePick = () => {
    void startPicker(closeOnPickSuccess ? { closeOnSuccess: true } : undefined);
  };

  return (
    <div className={className}>
      <header className="grip-popup-header">
        <div className="grip-popup-brand">
          <GripIcon size={22} />
          <span className="grip-popup-title">Grip</span>
        </div>
        <div className="grip-popup-header-actions">
          <Tooltip text={mcpOk ? "MCP connected on :9222" : "Chrome debug port not found"}>
            <span className={`grip-chip ${mcpOk ? "grip-chip-ok" : "grip-chip-warn"}`}>
              {mcpOk ? "MCP" : "—"}
            </span>
          </Tooltip>
          {onMinimize ? (
            <Tooltip text="Minimize panel">
              <button
                type="button"
                className="grip-btn-icon grip-btn-minimize"
                aria-label="Minimize panel"
                onClick={onMinimize}
              >
                <MinusIcon size={16} />
              </button>
            </Tooltip>
          ) : null}
        </div>
      </header>

      <GripSessionToolbar
        variant="popup"
        onPick={handlePick}
        onOpenPanel={onOpenPanel}
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
