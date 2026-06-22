import { newSessionId, toStoredPick, type StoredPick } from "@grip/core";
import type { GripRuntime, RuntimeMessage, StorageChangeHandler } from "@grip/devtools";

const SESSION_KEY = "pickSessionId";
const HISTORY_KEY = "pickHistory";

const samplePick = toStoredPick(
  {
    tagName: "button",
    css: "#grip-target",
    xpath: "//button[@id='grip-target']",
    role: "button",
    name: "",
    innerText: "Grip Search",
    rect: { top: 0, left: 0, width: 120, height: 40 },
    shadowDOM: false,
    iframe: "none",
    comment: "Primary CTA on hero",
  },
  "http://localhost:5174/",
  "Grip Playground",
  "playground-session",
);

let sessionId = "playground-session";
let pickHistory: StoredPick[] = [samplePick];
let lastPick: StoredPick | undefined = samplePick;
const storageListeners = new Set<StorageChangeHandler>();

function emitStorage(
  area: "local" | "session",
  changes: Record<string, chrome.storage.StorageChange>,
) {
  for (const handler of storageListeners) {
    handler(changes, area);
  }
}

function withTabId(msg: RuntimeMessage): RuntimeMessage {
  return msg;
}

export const playgroundRuntime: GripRuntime = {
  sendMessage<T>(msg: RuntimeMessage): Promise<T> {
    const m = withTabId(msg);
    switch (m.type) {
      case "GET_PICK_HISTORY":
        return Promise.resolve({
          history: pickHistory.filter((p) => p.sessionId === sessionId),
          all: pickHistory,
        } as T);
      case "NEW_SESSION": {
        pickHistory = pickHistory.filter((p) => p.sessionId !== sessionId);
        sessionId = newSessionId();
        lastPick = undefined;
        emitStorage("local", {
          pickHistory: { newValue: [...pickHistory], oldValue: undefined },
        });
        emitStorage("session", {
          pickSessionId: { newValue: sessionId, oldValue: undefined },
          lastPick: { newValue: undefined, oldValue: lastPick },
        });
        return Promise.resolve({ ok: true, history: [] } as T);
      }
      case "START_PICKER":
        return Promise.resolve({ ok: true } as T);
      case "TOGGLE_GRIP_TRAY":
      case "SHOW_TRAY":
      case "NAVIGATE_TO_PICK":
        return Promise.resolve({ ok: true } as T);
      case "UPDATE_PICK_COMMENT": {
        const payload = m.payload as { pickId: string; comment?: string };
        pickHistory = pickHistory.map((p) =>
          p.id === payload.pickId
            ? { ...p, comment: payload.comment?.trim() || undefined }
            : p,
        );
        if (lastPick?.id === payload.pickId) {
          lastPick = pickHistory.find((p) => p.id === payload.pickId);
        }
        emitStorage("local", {
          pickHistory: { newValue: [...pickHistory], oldValue: undefined },
        });
        return Promise.resolve({ ok: true } as T);
      }
      case "PANEL_READY":
        return Promise.resolve({
          lastPick,
          logs: [
            { level: "log", message: "Playground dev server ready", timestamp: Date.now() },
            { level: "warn", message: "Mock runtime — no extension required", timestamp: Date.now() },
          ],
        } as T);
      default:
        return Promise.resolve({ ok: true } as T);
    }
  },

  onStorageChanged(handler: StorageChangeHandler) {
    storageListeners.add(handler);
    return () => storageListeners.delete(handler);
  },

  async getPageUrl() {
    return window.location.origin + "/";
  },

  checkMcp() {
    return Promise.resolve({ ok: false });
  },

  sessionGet(keys: string | string[]) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const out: Record<string, unknown> = {};
    if (keyList.includes(SESSION_KEY)) out[SESSION_KEY] = sessionId;
    if (keyList.includes("lastPick")) out.lastPick = lastPick;
    if (keyList.includes(HISTORY_KEY)) out[HISTORY_KEY] = pickHistory;
    return Promise.resolve(out);
  },

  sessionSet(items: Record<string, unknown>) {
    if ("lastPick" in items) {
      lastPick = items.lastPick as StoredPick | undefined;
      emitStorage("session", {
        lastPick: { newValue: lastPick, oldValue: undefined },
      });
    }
    return Promise.resolve();
  },

  getIconUrl(path = "public/icons/icon-32.png") {
    const file = path.replace(/^public\//, "");
    return `/${file}`;
  },
};
