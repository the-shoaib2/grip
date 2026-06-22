import { useEffect } from "preact/hooks";
import { useGripStore } from "../../stores/gripStore";
import type { LogMessagePayload, PickerElementPayload } from "@grip/core";
import { LogPanel } from "./LogPanel";
import "../../styles/globals.css";

export function App() {
  const lastPick = useGripStore((s) => s.lastPick);
  const setLastPick = useGripStore((s) => s.setLastPick);
  const addLog = useGripStore((s) => s.addLog);
  const clearLogs = useGripStore((s) => s.clearLogs);

  useEffect(() => {
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
        const next = changes.logs.newValue as LogMessagePayload[];
        useGripStore.setState({ logs: next });
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [setLastPick, addLog, clearLogs]);

  if (!lastPick) {
    return (
      <div className="grip-panel p-3">
        <p className="text-zinc-500">Use the popup to pick an element on an http(s) page.</p>
        <LogPanel />
      </div>
    );
  }

  return (
    <div className="grip-panel space-y-2 p-3">
      <div>
        <div className="grip-label">CSS</div>
        <div className="grip-value">{lastPick.css}</div>
      </div>
      <div>
        <div className="grip-label">XPath</div>
        <div className="grip-value">{lastPick.xpath}</div>
      </div>
      <div>
        <div className="grip-label">Role</div>
        <div className="grip-value">{lastPick.role}</div>
      </div>
      <div>
        <div className="grip-label">Shadow DOM</div>
        <div className="grip-value">{lastPick.shadowDOM ? "yes" : "no"}</div>
      </div>
      <div>
        <div className="grip-label">iframe</div>
        <div className="grip-value">{lastPick.iframe}</div>
      </div>
      <LogPanel />
    </div>
  );
}
