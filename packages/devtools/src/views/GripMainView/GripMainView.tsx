import { useEffect, useState } from "preact/hooks";
import type { LogMessagePayload, PickerElementPayload } from "@grip/core";
import {
  GripIcon,
  GripMcpChip,
  GripSessionToolbar,
  MinusIcon,
  PickErrorBanner,
  PickHistoryList,
  Tooltip,
} from "../../components";
import { usePickHistory } from "../../hooks/usePickHistory";
import { usePickerActive } from "../../hooks/usePickerActive";
import { useStartPicker } from "../../hooks/useStartPicker";
import { GripRootLayout, type GripShellVariant } from "../../layout";
import { useGripStore } from "../../store/gripStore";
import { useGripRuntime } from "../../runtime/context";

export interface GripMainViewProps {
  variant?: GripShellVariant;
  closeOnPickSuccess?: boolean;
  onMinimize?: () => void;
  syncPanelReady?: boolean;
}

export function GripMainView({
  variant = "popup",
  closeOnPickSuccess = false,
  onMinimize,
  syncPanelReady = false,
}: GripMainViewProps) {
  const runtime = useGripRuntime();
  const setLastPick = useGripStore((s) => s.setLastPick);
  const addLog = useGripStore((s) => s.addLog);
  const clearLogs = useGripStore((s) => s.clearLogs);
  const [mcpOk, setMcpOk] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const { history, activePick, newSession, selectPick, deletePick } = usePickHistory(runtime);
  const isPickerActive = usePickerActive(runtime);
  const { pickError, startPicker, stopPicker } = useStartPicker(runtime);

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
    if (isPickerActive) {
      void stopPicker();
      return;
    }
    void startPicker(closeOnPickSuccess ? { closeOnSuccess: true } : undefined);
  };

  return (
    <GripRootLayout variant={variant}>
      <header className="grip-popup-header">
        <div className="grip-popup-brand">
          <GripIcon size={22} />
          <span className="grip-popup-title">Grip</span>
        </div>
        <div className="grip-popup-header-actions">
          <GripMcpChip connected={mcpOk} onConfigure={() => runtime.openMcpDocs()} />
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
        pickActive={isPickerActive}
        historyOpen={historyOpen}
        sessionCount={history.length}
        onPick={handlePick}
        onToggleHistory={() => setHistoryOpen((open) => !open)}
        onNewSession={() => void newSession()}
      />

      {pickError ? <PickErrorBanner message={pickError} onRetry={handlePick} /> : null}

      {historyOpen ? (
        <div className="grip-popup-history">
          <PickHistoryList
            history={history}
            activeId={activePick?.id}
            onSelect={selectPick}
            onDelete={(pick) => void deletePick(pick)}
          />
        </div>
      ) : null}
    </GripRootLayout>
  );
}
