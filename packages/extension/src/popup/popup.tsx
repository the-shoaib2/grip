import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { checkChromeDebugPort, formatMcpPrompt, type StoredPick } from "@grip/core";
import { CopyButton } from "../components/CopyButton";
import { GripIcon } from "../components/GripIcon";
import { PickHistoryList } from "../components/PickHistoryList";
import { SelectDropdown } from "../components/SelectDropdown";
import { Tooltip } from "../components/Tooltip";
import "../styles/globals.css";

type CopyAs = "mcp" | "css" | "xpath";

function Popup() {
  const [mcpOk, setMcpOk] = useState(false);
  const [history, setHistory] = useState<StoredPick[]>([]);
  const [active, setActive] = useState<StoredPick | null>(null);
  const [copyAs, setCopyAs] = useState<CopyAs>("mcp");

  useEffect(() => {
    void checkChromeDebugPort().then((r: { ok: boolean }) => setMcpOk(r.ok));
    chrome.runtime.sendMessage({ type: "GET_PICK_HISTORY" }, (data: {
      history?: StoredPick[];
    }) => {
      if (chrome.runtime.lastError) return;
      const items = data?.history ?? [];
      setHistory(items);
      if (items[0]) setActive(items[0]);
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

  const selectPick = (pick: StoredPick) => {
    setActive(pick);
    chrome.runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick }, () => {
      void chrome.runtime.lastError;
    });
  };

  const activeCopyText = !active
    ? ""
    : copyAs === "css"
      ? active.css
      : copyAs === "xpath"
        ? active.xpath
        : formatMcpPrompt(active);

  const activeCopyTooltip =
    copyAs === "css"
      ? "Copy CSS for selected element"
      : copyAs === "xpath"
        ? "Copy XPath for selected element"
        : "Copy MCP prompt for selected element";

  return (
    <div className="grip-popup">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripIcon size={22} />
          <span className="text-sm font-semibold">Grip</span>
        </div>
        <Tooltip text={mcpOk ? "MCP connected on :9222" : "Chrome debug port not found"}>
          <span className={mcpOk ? "grip-chip-ok" : "grip-chip-warn"}>
            {mcpOk ? "MCP" : "—"}
          </span>
        </Tooltip>
      </div>

      <div className="mt-3 flex gap-2">
        <Tooltip text="Pick any element on the page" className="flex-1">
          <button type="button" className="grip-btn-primary w-full" onClick={startPicker}>
            Pick
          </button>
        </Tooltip>
        <Tooltip text="Open saved picks on the page">
          <button type="button" className="grip-btn-secondary" onClick={openTray}>
            List
          </button>
        </Tooltip>
      </div>

      <div className="mt-3 min-w-0">
        <PickHistoryList
          history={history}
          activeId={active?.id}
          copyAs={copyAs}
          onSelect={selectPick}
        />
      </div>

      {active && (
        <div className="mt-3 flex min-w-0 items-end gap-2">
          <SelectDropdown
            label="Copy as"
            className="flex-1"
            value={copyAs}
            options={[
              { value: "mcp", label: "MCP prompt" },
              { value: "css", label: "CSS" },
              { value: "xpath", label: "XPath" },
            ]}
            onChange={(v) => setCopyAs(v as CopyAs)}
          />
          <CopyButton
            label="Copy"
            text={activeCopyText}
            tooltip={activeCopyTooltip}
          />
        </div>
      )}
    </div>
  );
}

render(<Popup />, document.getElementById("app")!);
