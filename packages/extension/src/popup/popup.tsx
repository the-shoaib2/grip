import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { checkChromeDebugPort } from "@grip/core";
import { GripIcon } from "../components/GripIcon";
import "../styles/globals.css";

function Popup() {
  const [mcpOk, setMcpOk] = useState(false);

  useEffect(() => {
    void checkChromeDebugPort().then((r: { ok: boolean }) => setMcpOk(r.ok));
  }, []);

  const startPicker = () => {
    chrome.runtime.sendMessage({ type: "START_PICKER" }, () => {
      void chrome.runtime.lastError;
      window.close();
    });
  };

  return (
    <div className="w-64 bg-zinc-950 p-4 text-zinc-100">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripIcon size={24} />
          <h1 className="text-sm font-semibold">Grip</h1>
        </div>
        <span className={mcpOk ? "grip-chip-ok" : "grip-chip-warn"}>
          {mcpOk ? "MCP" : "No MCP"}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">Grab anything on the web.</p>
      <button type="button" className="grip-btn-primary mt-4" onClick={startPicker}>
        Pick element
      </button>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-zinc-600">
        Add a context comment after pick. Open DevTools → Grip for copy &amp; MCP prompt.
      </p>
    </div>
  );
}

render(<Popup />, document.getElementById("app")!);
