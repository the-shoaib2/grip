import { useEffect, useState } from "preact/hooks";
import { useGripStore } from "../../stores/gripStore";
import {
  checkChromeDebugPort,
  formatMcpPrompt,
  type LogMessagePayload,
  type PickerElementPayload,
} from "@grip/core";
import { CopyButton } from "../../components/CopyButton";
import { FieldRow } from "../../components/FieldRow";
import { LogPanel } from "./LogPanel";
import "../../styles/globals.css";

export function App() {
  const lastPick = useGripStore((s) => s.lastPick);
  const setLastPick = useGripStore((s) => s.setLastPick);
  const addLog = useGripStore((s) => s.addLog);
  const clearLogs = useGripStore((s) => s.clearLogs);
  const [mcpOk, setMcpOk] = useState(false);
  const [mcpBrowser, setMcpBrowser] = useState<string>();

  useEffect(() => {
    void checkChromeDebugPort().then((r: { ok: boolean; browser?: string }) => {
      setMcpOk(r.ok);
      setMcpBrowser(r.browser);
    });

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

    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "session") return;
      if (changes.lastPick?.newValue) {
        setLastPick(changes.lastPick.newValue as PickerElementPayload);
      }
      if (changes.logs?.newValue) {
        useGripStore.setState({ logs: changes.logs.newValue as LogMessagePayload[] });
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [setLastPick, addLog, clearLogs]);

  const startPicker = () => {
    chrome.runtime.sendMessage({ type: "START_PICKER" }, () => {
      void chrome.runtime.lastError;
    });
  };

  const mcpPrompt = lastPick ? formatMcpPrompt(lastPick) : "";

  return (
    <div className="grip-panel flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Grip</h1>
          <p className="text-[11px] text-zinc-500">Deep pick · MCP ready</p>
        </div>
        <span className={mcpOk ? "grip-chip-ok" : "grip-chip-warn"}>
          {mcpOk ? "MCP :9222" : "MCP offline"}
        </span>
      </header>

      {mcpOk && mcpBrowser && (
        <p className="grip-mono truncate text-[10px] text-zinc-600">{mcpBrowser}</p>
      )}

      <button type="button" className="grip-btn-primary" onClick={startPicker}>
        Pick element
      </button>

      {!lastPick ? (
        <p className="text-center text-xs text-zinc-500">
          Click any element — shadow DOM &amp; iframes (same-origin). Press Esc to cancel.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <CopyButton label="Copy MCP prompt" text={mcpPrompt} />
            <CopyButton label="Copy CSS" text={lastPick.css} variant="ghost" />
            <CopyButton label="Copy XPath" text={lastPick.xpath} variant="ghost" />
          </div>

          <FieldRow label="Element" value={`${lastPick.tagName} · ${lastPick.role}`} copyLabel="Copy" />
          <FieldRow label="Text" value={lastPick.innerText || "(empty)"} />
          <FieldRow label="CSS selector" value={lastPick.css} />
          <FieldRow label="XPath" value={lastPick.xpath} />
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <div>
              <span className="grip-label">Shadow DOM</span>
              <p className="mt-1">{lastPick.shadowDOM ? "yes" : "no"}</p>
            </div>
            <div>
              <span className="grip-label">iframe</span>
              <p className="mt-1 truncate">{lastPick.iframe}</p>
            </div>
          </div>
        </div>
      )}

      <LogPanel />
    </div>
  );
}
