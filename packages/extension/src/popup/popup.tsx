import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { checkChromeDebugPort, formatMcpPrompt, type StoredPick } from "@grip/core";
import { CopyButton } from "../components/CopyButton";
import { GripIcon } from "../components/GripIcon";
import { SelectDropdown } from "../components/SelectDropdown";
import "../styles/globals.css";

function Popup() {
  const [mcpOk, setMcpOk] = useState(false);
  const [history, setHistory] = useState<StoredPick[]>([]);
  const [active, setActive] = useState<StoredPick | null>(null);
  const [copyAs, setCopyAs] = useState("mcp");

  useEffect(() => {
    void checkChromeDebugPort().then((r: { ok: boolean }) => setMcpOk(r.ok));
    chrome.runtime.sendMessage({ type: "GET_PICK_HISTORY" }, (data: {
      history?: StoredPick[];
    }) => {
      if (chrome.runtime.lastError) return;
      setHistory(data?.history ?? []);
      if (data?.history?.[0]) setActive(data.history[0]);
    });
  }, []);

  const startPicker = () => {
    chrome.runtime.sendMessage({ type: "START_PICKER" }, () => {
      void chrome.runtime.lastError;
      window.close();
    });
  };

  const openTray = () => {
    chrome.runtime.sendMessage({ type: "TOGGLE_GRIP_TRAY" }, () => {
      void chrome.runtime.lastError;
      window.close();
    });
  };

  const goTo = (pick: StoredPick) => {
    setActive(pick);
    chrome.runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick }, () => {
      void chrome.runtime.lastError;
    });
  };

  const copyText =
    !active
      ? ""
      : copyAs === "css"
        ? active.css
        : copyAs === "xpath"
          ? active.xpath
          : formatMcpPrompt(active);

  return (
    <div className="w-72 bg-zinc-950 p-3 text-zinc-100">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripIcon size={22} />
          <span className="text-sm font-semibold">Grip</span>
        </div>
        <span className={mcpOk ? "grip-chip-ok" : "grip-chip-warn"}>
          {mcpOk ? "MCP" : "—"}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" className="grip-btn-primary flex-1" onClick={startPicker}>
          Pick
        </button>
        <button type="button" className="grip-btn-secondary" onClick={openTray} title="Page dropdown">
          List
        </button>
      </div>

      <SelectDropdown
        label="Saved on page"
        className="mt-3"
        value={active?.id ?? ""}
        options={[
          { value: "", label: history.length ? "Select element…" : "No picks yet" },
          ...history.map((p) => ({ value: p.id, label: p.label })),
        ]}
        onChange={(id) => {
          const pick = history.find((p) => p.id === id);
          if (pick) goTo(pick);
        }}
      />

      {history.length > 0 && (
        <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
          {history.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`grip-badge ${active?.id === p.id ? "grip-badge-active" : ""}`}
              onClick={() => goTo(p)}
              title={p.css}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="mt-3 flex items-end gap-2">
          <SelectDropdown
            className="flex-1"
            value={copyAs}
            options={[
              { value: "mcp", label: "MCP prompt" },
              { value: "css", label: "CSS" },
              { value: "xpath", label: "XPath" },
            ]}
            onChange={setCopyAs}
          />
          <CopyButton label="Copy" text={copyText} />
        </div>
      )}
    </div>
  );
}

render(<Popup />, document.getElementById("app")!);
