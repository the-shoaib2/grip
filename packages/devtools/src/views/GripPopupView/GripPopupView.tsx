import { useEffect, useState } from "preact/hooks";
import type { StoredPick } from "@grip/core";
import {
  GripIcon,
  HistoryIcon,
  MousePointerClickIcon,
  PickHistoryList,
  PlusIcon,
  Tooltip,
} from "../../components";
import { gripUserError } from "../../lib/errors";
import { useGripRuntime } from "../../runtime/context";

export function GripPopupView() {
  const runtime = useGripRuntime();
  const [mcpOk, setMcpOk] = useState(false);
  const [history, setHistory] = useState<StoredPick[]>([]);
  const [active, setActive] = useState<StoredPick | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  useEffect(() => {
    void runtime.checkMcp().then((r) => setMcpOk(r.ok));
    void runtime
      .sendMessage<{ history?: StoredPick[] }>({ type: "GET_PICK_HISTORY" })
      .then((data) => {
        const items = data?.history ?? [];
        setHistory(items);
        if (items[0]) setActive(items[0]);
      })
      .catch(() => {
        /* ignore */
      });
  }, [runtime]);

  const startPicker = () => {
    setPickError(null);
    void runtime
      .sendMessage<{ ok?: boolean; error?: string }>({ type: "START_PICKER" })
      .then((res) => {
        if (res?.ok === false) {
          setPickError(gripUserError(res.error));
          return;
        }
        runtime.closeWindow?.();
      })
      .catch((err: Error) => {
        setPickError(gripUserError(err.message));
      });
  };

  const openTray = () => {
    void runtime
      .sendMessage({ type: "TOGGLE_GRIP_TRAY" })
      .catch(() => {
        /* ignore */
      })
      .finally(() => runtime.closeWindow?.());
  };

  const newSession = () => {
    void runtime
      .sendMessage<{ history?: StoredPick[] }>({ type: "NEW_SESSION" })
      .then((data) => {
        setHistory(data?.history ?? []);
        setActive(null);
      })
      .catch(() => {
        /* ignore */
      });
  };

  const selectPick = (pick: StoredPick) => {
    setActive(pick);
    void runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick });
  };

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

      <div className="mt-3 flex items-center justify-between gap-2">
        <Tooltip text="Pick any element on the page">
          <button
            type="button"
            className="grip-btn-ghost grip-btn-toolbar"
            onClick={startPicker}
          >
            <MousePointerClickIcon size={16} />
            <span>Pick</span>
          </button>
        </Tooltip>
        <div className="flex items-center gap-1">
          <Tooltip text="Open saved picks on the page">
            <button
              type="button"
              className="grip-btn-ghost grip-btn-toolbar"
              onClick={openTray}
            >
              <HistoryIcon size={16} />
              <span>History</span>
            </button>
          </Tooltip>
          <Tooltip text="New session — clear picks for this page">
            <button
              type="button"
              className="grip-btn-ghost grip-btn-toolbar"
              onClick={newSession}
            >
              <PlusIcon size={16} />
              <span>New</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {pickError && (
        <p className="mt-2 text-[11px] leading-snug" style={{ color: "var(--grip-danger)" }}>
          {pickError}
        </p>
      )}

      <div className="mt-3 min-w-0">
        <PickHistoryList
          history={history}
          activeId={active?.id}
          onSelect={selectPick}
        />
      </div>
    </div>
  );
}
