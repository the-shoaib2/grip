import {
  appendPickHistory,
  newSessionId,
  removePickFromHistory,
  clearPicksForSession,
  toStoredPick,
  updatePickInHistory,
  type PickerElementPayload,
  type OpenContextEditorPayload,
  type ShowTrayPayload,
  type StoredPick,
  GRIP_MCP_DOCS_URL,
} from "@grip/core";
import type { GripRuntime, RuntimeMessage, StorageChangeHandler } from "@grip/devtools";
import { startPlaygroundPicker, stopPlaygroundPicker, openPlaygroundContextEditor } from "./playgroundPicker";
import { hideTrayForHandoff, showTrayAfterHandoff } from "./trayBridge";

const TAB_SESSIONS_KEY = "tabSessionIds";
const HISTORY_KEY = "pickHistory";
const PICKER_ACTIVE_KEY = "pickerActive";
const MOCK_TAB_ID = 1;

let pickerActive = false;

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
  "playground-session-prev",
);

const samplePickInput = toStoredPick(
  {
    tagName: "input",
    css: "#pg-search-input",
    xpath: "//input[@id='pg-search-input']",
    role: "searchbox",
    name: "Search",
    innerText: "",
    rect: { top: 0, left: 0, width: 200, height: 40 },
    shadowDOM: false,
    iframe: "none",
    comment: "Hero search field",
  },
  "http://localhost:5174/",
  "Grip Playground",
  "playground-session",
);

let sessionId = "playground-session";
let tabSessionIds: Record<string, string> = { [String(MOCK_TAB_ID)]: sessionId };
let pickHistory: StoredPick[] = [];
let lastPick: StoredPick | undefined;

pickHistory = appendPickHistory(pickHistory, samplePick);
pickHistory = appendPickHistory(pickHistory, samplePickInput);
lastPick = pickHistory.find((p) => p.sessionId === sessionId);
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
  return msg.tabId == null ? { ...msg, tabId: MOCK_TAB_ID } : msg;
}

function setPickerActive(active: boolean): void {
  const oldValue = pickerActive;
  pickerActive = active;
  emitStorage("session", {
    pickerActive: { newValue: active, oldValue },
  });
}

function recordPlaygroundPick(payload: PickerElementPayload): void {
  const stored = toStoredPick(
    payload,
    window.location.href,
    document.title || "Grip Playground",
    sessionId,
  );
  pickHistory = appendPickHistory(pickHistory, stored);
  lastPick = stored;
  emitStorage("local", {
    pickHistory: { newValue: [...pickHistory], oldValue: undefined },
  });
  emitStorage("session", {
    lastPick: { newValue: lastPick, oldValue: undefined },
  });
}

function startMockPicker(): void {
  startPlaygroundPicker({
    onSave: recordPlaygroundPick,
    onStop: () => setPickerActive(false),
  });
  setPickerActive(true);
}

function stopMockPicker(): void {
  stopPlaygroundPicker(false);
  setPickerActive(false);
}

export const playgroundRuntime: GripRuntime = {
  sendMessage<T>(msg: RuntimeMessage): Promise<T> {
    const m = withTabId(msg);
    switch (m.type) {
      case "GET_PICK_HISTORY":
        return Promise.resolve({
          history: pickHistory.filter((p) => p.sessionId === sessionId),
          all: pickHistory,
          sessionId,
          tabId: MOCK_TAB_ID,
        } as T);
      case "NEW_SESSION": {
        pickHistory = pickHistory.filter((p) => p.sessionId !== sessionId);
        sessionId = newSessionId();
        tabSessionIds = { ...tabSessionIds, [String(MOCK_TAB_ID)]: sessionId };
        lastPick = undefined;
        emitStorage("local", {
          pickHistory: { newValue: [...pickHistory], oldValue: undefined },
        });
        emitStorage("session", {
          tabSessionIds: { newValue: { ...tabSessionIds }, oldValue: undefined },
          lastPick: { newValue: undefined, oldValue: lastPick },
        });
        return Promise.resolve({ ok: true, history: [], sessionId, tabId: MOCK_TAB_ID } as T);
      }
      case "START_PICKER":
        hideTrayForHandoff();
        startMockPicker();
        return Promise.resolve({ ok: true } as T);
      case "STOP_PICKER":
        stopMockPicker();
        return Promise.resolve({ ok: true } as T);
      case "TOGGLE_GRIP_TRAY":
        return Promise.resolve({ ok: true } as T);
      case "HIDE_TRAY":
        hideTrayForHandoff();
        return Promise.resolve({ ok: true } as T);
      case "SHOW_TRAY": {
        const payload = m.payload as ShowTrayPayload | undefined;
        showTrayAfterHandoff(Boolean(payload?.restore));
        return Promise.resolve({ ok: true } as T);
      }
      case "NAVIGATE_TO_PICK": {
        const payload = m.payload as StoredPick;
        const el = document.querySelector(payload.css);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          el.classList.add("grip-nav-flash");
          window.setTimeout(() => el.classList.remove("grip-nav-flash"), 1200);
        }
        if (lastPick?.id !== payload.id) {
          lastPick = payload;
          emitStorage("session", {
            lastPick: { newValue: lastPick, oldValue: undefined },
          });
        }
        return Promise.resolve({ ok: true } as T);
      }
      case "OPEN_CONTEXT_EDITOR": {
        const payload = m.payload as OpenContextEditorPayload;
        openPlaygroundContextEditor(
          payload,
          (pickId, comment) => {
            pickHistory = updatePickInHistory(pickHistory, pickId, {
              comment: comment.trim() || undefined,
            });
            if (lastPick?.id === pickId) {
              lastPick = pickHistory.find((p) => p.id === pickId);
            }
            emitStorage("local", {
              pickHistory: { newValue: [...pickHistory], oldValue: undefined },
            });
          },
          () => {
            if (pickerActive) {
              stopPlaygroundPicker(false);
              setPickerActive(false);
            }
          },
        );
        return Promise.resolve({ ok: true } as T);
      }
      case "UPDATE_PICK_COMMENT": {
        const payload = m.payload as { pickId: string; comment?: string };
        pickHistory = updatePickInHistory(pickHistory, payload.pickId, {
          comment: payload.comment?.trim() || undefined,
        });
        if (lastPick?.id === payload.pickId) {
          lastPick = pickHistory.find((p) => p.id === payload.pickId);
        }
        emitStorage("local", {
          pickHistory: { newValue: [...pickHistory], oldValue: undefined },
        });
        return Promise.resolve({ ok: true } as T);
      }
      case "DELETE_PICK": {
        const payload = m.payload as { pickId: string };
        pickHistory = removePickFromHistory(pickHistory, payload.pickId);
        if (lastPick?.id === payload.pickId) {
          const sessionPicks = pickHistory.filter((p) => p.sessionId === sessionId);
          lastPick = sessionPicks[sessionPicks.length - 1];
        }
        emitStorage("local", {
          pickHistory: { newValue: [...pickHistory], oldValue: undefined },
        });
        emitStorage("session", {
          lastPick: { newValue: lastPick, oldValue: undefined },
        });
        return Promise.resolve({ ok: true } as T);
      }
      case "SET_ACTIVE_SESSION": {
        const payload = m.payload as { sessionId: string };
        const sessionPicks = pickHistory.filter((p) => p.sessionId === payload.sessionId);
        if (!sessionPicks.length) {
          return Promise.resolve({ ok: false, error: "Session not found" } as T);
        }
        sessionId = payload.sessionId;
        tabSessionIds = { ...tabSessionIds, [String(MOCK_TAB_ID)]: sessionId };
        lastPick = sessionPicks[sessionPicks.length - 1];
        emitStorage("session", {
          tabSessionIds: { newValue: { ...tabSessionIds }, oldValue: undefined },
          lastPick: { newValue: lastPick, oldValue: undefined },
        });
        return Promise.resolve({
          ok: true,
          history: sessionPicks,
          sessionId,
          tabId: MOCK_TAB_ID,
        } as T);
      }
      case "DELETE_SESSION": {
        const payload = m.payload as { sessionId: string };
        pickHistory = clearPicksForSession(
          pickHistory,
          window.location.origin + "/",
          payload.sessionId,
        );
        if (sessionId === payload.sessionId) {
          sessionId = newSessionId();
          tabSessionIds = { ...tabSessionIds, [String(MOCK_TAB_ID)]: sessionId };
          lastPick = undefined;
        }
        emitStorage("local", {
          pickHistory: { newValue: [...pickHistory], oldValue: undefined },
        });
        emitStorage("session", {
          tabSessionIds: { newValue: { ...tabSessionIds }, oldValue: undefined },
          lastPick: { newValue: lastPick, oldValue: undefined },
        });
        const sessionPicks = pickHistory.filter((p) => p.sessionId === sessionId);
        return Promise.resolve({
          ok: true,
          history: sessionPicks,
          sessionId,
          tabId: MOCK_TAB_ID,
        } as T);
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
    return window.location.href.split("#")[0];
  },

  getTargetTabId() {
    return MOCK_TAB_ID;
  },

  checkMcp() {
    return Promise.resolve({ ok: false });
  },

  openMcpDocs() {
    window.open(GRIP_MCP_DOCS_URL, "_blank", "noopener,noreferrer");
  },

  sessionGet(keys: string | string[]) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const out: Record<string, unknown> = {};
    if (keyList.includes(TAB_SESSIONS_KEY)) out[TAB_SESSIONS_KEY] = tabSessionIds;
    if (keyList.includes("lastPick")) out.lastPick = lastPick;
    if (keyList.includes(HISTORY_KEY)) out[HISTORY_KEY] = pickHistory;
    if (keyList.includes(PICKER_ACTIVE_KEY)) out[PICKER_ACTIVE_KEY] = pickerActive;
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
