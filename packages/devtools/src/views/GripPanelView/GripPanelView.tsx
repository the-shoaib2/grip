import { useEffect, useMemo, useState } from "preact/hooks";
import {
  formatMcpPrompt,
  type LogMessagePayload,
  type PickerElementPayload,
  type StoredPick,
} from "@grip/core";
import {
  CommentField,
  CopyButton,
  GripIcon,
  GripSessionToolbar,
  PickHistoryList,
  SelectDropdown,
  Tooltip,
} from "../../components";
import { usePickHistory } from "../../hooks/usePickHistory";
import { useGripStore } from "../../store/gripStore";
import { useGripRuntime } from "../../runtime/context";
import { LogPanel } from "../LogPanel";

type CopyAs = "mcp" | "css" | "xpath";

export interface GripPanelViewProps {
  layout?: "panel" | "floating";
}

export function GripPanelView({ layout = "panel" }: GripPanelViewProps) {
  const runtime = useGripRuntime();
  const lastPick = useGripStore((s) => s.lastPick);
  const setLastPick = useGripStore((s) => s.setLastPick);
  const setPickComment = useGripStore((s) => s.setPickComment);
  const addLog = useGripStore((s) => s.addLog);
  const clearLogs = useGripStore((s) => s.clearLogs);
  const [mcpOk, setMcpOk] = useState(false);
  const [copyAs, setCopyAs] = useState<CopyAs>("mcp");
  const { history, activePick, newSession, selectPick } = usePickHistory(runtime);

  const activeId = useMemo(() => {
    if (lastPick) {
      return history.find((h) => h.css === lastPick.css)?.id ?? activePick?.id;
    }
    return activePick?.id;
  }, [history, lastPick, activePick]);

  useEffect(() => {
    void runtime.checkMcp().then((r) => setMcpOk(r.ok));

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
  }, [runtime, setLastPick, addLog, clearLogs]);

  const copyText = useMemo(() => {
    if (!lastPick) return "";
    if (copyAs === "css") return lastPick.css;
    if (copyAs === "xpath") return lastPick.xpath;
    return formatMcpPrompt(lastPick);
  }, [copyAs, lastPick]);

  const copyTooltip =
    copyAs === "css"
      ? "Copy CSS for selected element"
      : copyAs === "xpath"
        ? "Copy XPath for selected element"
        : "Copy prompt for selected element";

  const persistComment = (comment: string) => {
    setPickComment(comment);
    if (!lastPick) return;

    const trimmed = comment.trim() || undefined;
    const nextPick = { ...lastPick, comment: trimmed };
    setLastPick(nextPick);
    void runtime.sessionSet({ lastPick: nextPick });

    const stored =
      (activeId ? history.find((h) => h.id === activeId) : undefined) ??
      history.find((h) => h.css === lastPick.css);
    if (stored?.id) {
      void runtime.sendMessage({
        type: "UPDATE_PICK_COMMENT",
        payload: { pickId: stored.id, comment: trimmed },
      });
    }
  };

  const handleSelectPick = (pick: StoredPick) => {
    setLastPick(pick);
    selectPick(pick);
  };

  const panelClass =
    layout === "floating" ? "grip-panel grip-panel-floating" : "grip-panel";

  return (
    <div className={panelClass}>
      <header className="grip-panel-header">
        <div className="grip-panel-brand">
          <GripIcon size={24} />
          <h1 className="grip-panel-title">Grip</h1>
        </div>
        <div className="grip-popup-toolbar-actions">
          <GripSessionToolbar
            variant="compact"
            onPick={() => void runtime.sendMessage({ type: "START_PICKER" })}
            onNewSession={() => void newSession()}
          />
          <Tooltip text={mcpOk ? "MCP connected on :9222" : "Chrome debug port not found"}>
            <span className={`grip-chip ${mcpOk ? "grip-chip-ok" : "grip-chip-warn"}`}>
              {mcpOk ? "MCP" : "—"}
            </span>
          </Tooltip>
        </div>
      </header>

      <Tooltip text="Pick any element on the page">
        <button
          type="button"
          className="grip-btn-primary"
          onClick={() => void runtime.sendMessage({ type: "START_PICKER" })}
        >
          Pick
        </button>
      </Tooltip>

      <PickHistoryList
        history={history}
        activeId={activeId}
        onSelect={handleSelectPick}
      />

      {lastPick && (
        <>
          <CommentField
            value={lastPick.comment ?? ""}
            onChange={persistComment}
            tagName={lastPick.tagName}
            role={lastPick.role}
            css={lastPick.css}
            xpath={lastPick.xpath}
            innerText={lastPick.innerText}
            name={lastPick.name}
            rect={lastPick.rect}
            shadowDOM={lastPick.shadowDOM}
            iframe={lastPick.iframe}
          />
          <div className="grip-panel-copy-row">
            <SelectDropdown
              label="Copy as"
              value={copyAs}
              options={[
                { value: "mcp", label: "Prompt" },
                { value: "css", label: "CSS" },
                { value: "xpath", label: "XPath" },
              ]}
              onChange={(v) => setCopyAs(v as CopyAs)}
            />
            <CopyButton label="Copy" text={copyText} tooltip={copyTooltip} />
          </div>
        </>
      )}

      <LogPanel />
    </div>
  );
}
