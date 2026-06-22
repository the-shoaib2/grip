import { useEffect } from "preact/hooks";
import { useGripStore } from "../../stores/gripStore";
import type { GripMessage, LogMessagePayload, PickerElementPayload } from "@grip/core";
import { LogPanel } from "./LogPanel";
import "../../styles/globals.css";

export function App() {
  const lastPick = useGripStore((s) => s.lastPick);
  const setLastPick = useGripStore((s) => s.setLastPick);
  const addLog = useGripStore((s) => s.addLog);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "PANEL_READY" }, (data: {
      lastPick?: PickerElementPayload;
      logs?: LogMessagePayload[];
    }) => {
      if (data?.lastPick) setLastPick(data.lastPick);
      if (data?.logs) {
        for (const entry of data.logs) addLog(entry);
      }
    });

    const listener = (msg: GripMessage) => {
      if (msg.type === "PICKER_ELEMENT_SELECTED") {
        setLastPick(msg.payload as PickerElementPayload);
      }
      if (msg.type === "LOG_ENTRY") {
        addLog(msg.payload as LogMessagePayload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [setLastPick, addLog]);

  if (!lastPick) {
    return (
      <div className="grip-panel p-3">
        <p className="text-zinc-500">Use the popup to pick an element.</p>
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
