import { useEffect, useState } from "preact/hooks";
import type { LogMessagePayload, PickerElementPayload, StoredPick } from "@grip/core";
import {
  GripBrand,
  GripMcpChip,
  GripSessionToolbar,
  MinusIcon,
  PickErrorBanner,
  PickHistoryList,
  SessionHistoryList,
  SessionPickComposer,
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
  onContextEditRequest?: (
    pick: StoredPick,
    meta: { pickIndex: number; pickCount: number },
  ) => void;
}

export function GripMainView({
  variant = "popup",
  closeOnPickSuccess = false,
  onMinimize,
  syncPanelReady = false,
  onContextEditRequest,
}: GripMainViewProps) {
  const runtime = useGripRuntime();
  const setLastPick = useGripStore((s) => s.setLastPick);
  const addLog = useGripStore((s) => s.addLog);
  const clearLogs = useGripStore((s) => s.clearLogs);
  const [mcpOk, setMcpOk] = useState(false);
  const [historyView, setHistoryView] = useState(false);
  const {
    history,
    sessionGroups,
    activeSessionId,
    activePick,
    newSession,
    switchSession,
    selectPick,
    savePickComment,
    deletePick,
    deleteSession,
  } = usePickHistory();
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
      if (area === "session" && changes.lastPick) {
        setLastPick(
          (changes.lastPick.newValue as PickerElementPayload | undefined) ?? null,
        );
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
        <GripBrand />
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
        historyView={historyView}
        onPick={handlePick}
        onToggleHistoryView={() => setHistoryView((open) => !open)}
        onNewSession={() => {
          setHistoryView(false);
          void newSession();
        }}
      />

      {pickError ? <PickErrorBanner message={pickError} onRetry={handlePick} /> : null}

      {!historyView && activePick ? (
        <div className="grip-session-stack">
          <SessionPickComposer
            pick={activePick}
            pickIndex={history.findIndex((pick) => pick.id === activePick.id) + 1}
            pickCount={history.length}
            onCommentChange={(comment) => savePickComment(activePick.id, comment)}
            onNavigate={selectPick}
            onEditRequest={onContextEditRequest}
            onDeletePick={() => void deletePick(activePick.id)}
          />
          <PickHistoryList
            history={history}
            activeId={activePick.id}
            activeSessionId={activeSessionId}
            onSelect={selectPick}
            onDeletePick={(pick) => void deletePick(pick.id)}
            compact
          />
        </div>
      ) : !historyView ? (
        <p className="grip-empty-state">No picks yet</p>
      ) : null}

      <div className="grip-popup-history">
        {historyView ? (
          <SessionHistoryList
            groups={sessionGroups}
            activeSessionId={activeSessionId}
            onSelectSession={(sessionId) => {
              void switchSession(sessionId);
              setHistoryView(false);
            }}
            onDeleteSession={(sessionId) => void deleteSession(sessionId)}
          />
        ) : null}
      </div>
    </GripRootLayout>
  );
}
