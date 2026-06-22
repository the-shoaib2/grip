import { useEffect, useMemo, useState } from "preact/hooks";
import {
  formatMcpPrompt,
  picksForSession,
  type LogMessagePayload,
  type PickerElementPayload,
  type StoredPick,
} from "@grip/core";
import {
  CommentField,
  CopyButton,
  GripIcon,
  PickHistoryList,
  SelectDropdown,
  Tooltip,
} from "../../components";
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
  const [history, setHistory] = useState<StoredPick[]>([]);
  const [copyAs, setCopyAs] = useState<CopyAs>("mcp");

  const activeId = useMemo(() => {
    if (!lastPick) return undefined;
    return history.find((h) => h.css === lastPick.css)?.id;
  }, [history, lastPick]);

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

    void runtime
      .sendMessage<{ history?: StoredPick[] }>({ type: "GET_PICK_HISTORY" })
      .then((data) => setHistory(data?.history ?? []))
      .catch(() => {
        /* ignore */
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
      if (area === "local" && changes.pickHistory?.newValue) {
        void runtime.sessionGet("pickSessionId").then((sessionData) => {
          void runtime.getPageUrl().then((url) => {
            const sessionId = sessionData.pickSessionId as string | undefined;
            const all = changes.pickHistory!.newValue as StoredPick[];
            setHistory(sessionId ? picksForSession(all, url, sessionId) : []);
          });
        });
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
    if (lastPick) {
      void runtime.sessionSet({
        lastPick: { ...lastPick, comment: comment.trim() || undefined },
      });
    }
  };

  const selectPick = (pick: StoredPick) => {
    setLastPick(pick);
    void runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick });
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
        <Tooltip text={mcpOk ? "MCP connected on :9222" : "Chrome debug port not found"}>
          <span className={`grip-chip ${mcpOk ? "grip-chip-ok" : "grip-chip-warn"}`}>
            {mcpOk ? "MCP" : "—"}
          </span>
        </Tooltip>
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
        onSelect={selectPick}
      />

      {lastPick && (
        <>
          <CommentField
            value={lastPick.comment ?? ""}
            onChange={persistComment}
            tagName={lastPick.tagName}
            role={lastPick.role}
            css={lastPick.css}
            innerText={lastPick.innerText}
            name={lastPick.name}
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
