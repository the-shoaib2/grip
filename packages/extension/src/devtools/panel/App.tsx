import { useEffect, useMemo, useState } from "preact/hooks";
import { useGripStore } from "@/stores";
import {
  checkChromeDebugPort,
  formatMcpPrompt,
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
} from "@/components";
import { LogPanel } from "@/devtools/panel/LogPanel";
import "@/styles/globals.css";

type CopyAs = "mcp" | "css" | "xpath";

export function App() {
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
    void checkChromeDebugPort().then((r: { ok: boolean }) => setMcpOk(r.ok));

    chrome.runtime.sendMessage({ type: "PANEL_READY" }, (data: {
      lastPick?: PickerElementPayload;
      logs?: LogMessagePayload[];
    }) => {
      if (chrome.runtime.lastError) return;
      if (data?.lastPick) setLastPick(data.lastPick);
      if (data?.logs?.length) {
        clearLogs();
        for (const entry of data.logs) addLog(entry);
      }
    });

    chrome.runtime.sendMessage({ type: "GET_PICK_HISTORY" }, (data: {
      history?: StoredPick[];
    }) => {
      if (!chrome.runtime.lastError) setHistory(data?.history ?? []);
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
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const url = tabs[0]?.url ?? "";
          const all = changes.pickHistory!.newValue as StoredPick[];
          setHistory(
            all.filter((h) => {
              try {
                const u = new URL(url);
                const hu = new URL(h.url);
                return hu.origin + hu.pathname === u.origin + u.pathname;
              } catch {
                return h.url === url;
              }
            }),
          );
        });
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [setLastPick, addLog, clearLogs]);

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
      chrome.storage.session.set({
        lastPick: { ...lastPick, comment: comment.trim() || undefined },
      });
    }
  };

  const selectPick = (pick: StoredPick) => {
    setLastPick(pick);
    chrome.runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick });
  };

  return (
    <div className="grip-panel flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripIcon size={24} />
          <h1 className="text-sm font-semibold">Grip</h1>
        </div>
        <Tooltip text={mcpOk ? "MCP connected on :9222" : "Chrome debug port not found"}>
          <span className={mcpOk ? "grip-chip-ok" : "grip-chip-warn"}>
            {mcpOk ? "MCP" : "—"}
          </span>
        </Tooltip>
      </header>

      <Tooltip text="Pick any element on the page">
        <button
          type="button"
          className="grip-btn-primary w-full"
          onClick={() => chrome.runtime.sendMessage({ type: "START_PICKER" })}
        >
          Pick
        </button>
      </Tooltip>

      <PickHistoryList
        history={history}
        activeId={activeId}
        copyAs={copyAs}
        onSelect={selectPick}
      />

      {lastPick && (
        <>
          <CommentField value={lastPick.comment ?? ""} onChange={persistComment} />
          <div className="flex items-end gap-2">
            <SelectDropdown
              label="Copy as"
              className="flex-1"
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
