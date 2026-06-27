import {
  appendPickHistory,
  appendSessionToOrder,
  newSessionId,
  lastPickInSession,
  nextSessionIdAfterDelete,
  normalizePickCommentForStorage,
  picksForSession,
  removePickFromHistory,
  removeSessionFromOrder,
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
import {
  startPlaygroundPicker,
  stopPlaygroundPicker,
  openPlaygroundContextEditor,
  wirePlaygroundPickerHost,
} from "./playgroundPicker";
import {
  emitPlaygroundStorage,
  getPlaygroundState,
  onPlaygroundStorageChanged,
} from "./playgroundState";
import { hideTrayForHandoff, showTrayAfterHandoff } from "./trayBridge";

const TAB_SESSIONS_KEY = "tabSessionIds";
const HISTORY_KEY = "pickHistory";
const PICKER_ACTIVE_KEY = "pickerActive";
const MOCK_TAB_ID = 1;

function s() {
  return getPlaygroundState();
}

function pageUrl(): string {
  return window.location.href.split("#")[0] ?? window.location.href;
}

function emitStorage(
  area: "local" | "session",
  changes: Record<string, chrome.storage.StorageChange>,
) {
  emitPlaygroundStorage(area, changes);
}

function withTabId(msg: RuntimeMessage): RuntimeMessage {
  return msg.tabId == null ? { ...msg, tabId: MOCK_TAB_ID } : msg;
}

function setPickerActive(active: boolean): void {
  const state = s();
  const oldValue = state.pickerActive;
  state.pickerActive = active;
  emitStorage("session", {
    pickerActive: { newValue: active, oldValue },
  });
}

function syncPickHistoryStorage(): void {
  const state = s();
  emitStorage("local", {
    pickHistory: { newValue: [...state.pickHistory], oldValue: undefined },
  });
}

function syncLastPickStorage(oldPick?: StoredPick): void {
  const state = s();
  emitStorage("session", {
    lastPick: { newValue: state.lastPick, oldValue: oldPick },
  });
}

function recordPlaygroundPick(payload: PickerElementPayload): void {
  const state = s();
  const stored = toStoredPick(
    payload,
    pageUrl(),
    document.title || "Grip Playground",
    state.sessionId,
  );
  stored.comment = normalizePickCommentForStorage(stored.comment, stored.id);
  state.pickHistory = appendPickHistory(state.pickHistory, stored);
  state.lastPick = stored;
  syncPickHistoryStorage();
  syncLastPickStorage();
}

function showTrayFromPicker(options?: { restore?: boolean }): void {
  void playgroundRuntime.sendMessage({ type: "SHOW_TRAY", payload: options });
}

wirePlaygroundPickerHost({
  setPickerActive,
  showTray: showTrayFromPicker,
});

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
    const state = s();
    switch (m.type) {
      case "GET_PICK_HISTORY": {
        const url = pageUrl();
        const history = picksForSession(state.pickHistory, url, state.sessionId);
        return Promise.resolve({
          history,
          all: state.pickHistory,
          sessionId: state.sessionId,
          sessionOrder: state.tabSessionOrderIds[String(MOCK_TAB_ID)] ?? [state.sessionId],
          tabId: MOCK_TAB_ID,
        } as T);
      }
      case "NEW_SESSION": {
        state.sessionId = newSessionId();
        state.tabSessionIds = { ...state.tabSessionIds, [String(MOCK_TAB_ID)]: state.sessionId };
        state.tabSessionOrderIds = {
          ...state.tabSessionOrderIds,
          [String(MOCK_TAB_ID)]: appendSessionToOrder(
            state.tabSessionOrderIds[String(MOCK_TAB_ID)] ?? [],
            state.sessionId,
          ),
        };
        const oldPick = state.lastPick;
        state.lastPick = undefined;
        emitStorage("session", {
          tabSessionIds: { newValue: { ...state.tabSessionIds }, oldValue: undefined },
          lastPick: { newValue: undefined, oldValue: oldPick },
        });
        return Promise.resolve({
          ok: true,
          history: [],
          all: state.pickHistory,
          sessionId: state.sessionId,
          sessionOrder: state.tabSessionOrderIds[String(MOCK_TAB_ID)],
          tabId: MOCK_TAB_ID,
        } as T);
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
        syncPickHistoryStorage();
        syncLastPickStorage();
        return Promise.resolve({ ok: true } as T);
      }
      case "PICKER_ELEMENT_SELECTED": {
        recordPlaygroundPick(m.payload as PickerElementPayload);
        return Promise.resolve({ ok: true, pick: state.lastPick } as T);
      }
      case "NAVIGATE_TO_PICK": {
        const payload = m.payload as StoredPick;
        const el = document.querySelector(payload.css);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          el.classList.add("grip-nav-flash");
          window.setTimeout(() => el.classList.remove("grip-nav-flash"), 1200);
        }
        if (state.lastPick?.id !== payload.id) {
          state.lastPick = payload;
          syncLastPickStorage();
        }
        return Promise.resolve({ ok: true } as T);
      }
      case "OPEN_CONTEXT_EDITOR": {
        const payload = m.payload as OpenContextEditorPayload;
        openPlaygroundContextEditor(
          payload,
          (pickId, comment) => {
            state.pickHistory = updatePickInHistory(state.pickHistory, pickId, {
              comment: comment.trim() || undefined,
            });
            if (state.lastPick?.id === pickId) {
              state.lastPick = state.pickHistory.find((p) => p.id === pickId);
            }
            syncPickHistoryStorage();
            if (state.lastPick) syncLastPickStorage();
          },
          () => {
            if (state.pickerActive) {
              stopPlaygroundPicker(false);
              setPickerActive(false);
            }
          },
        );
        return Promise.resolve({ ok: true } as T);
      }
      case "UPDATE_PICK_COMMENT": {
        const payload = m.payload as { pickId: string; comment?: string };
        state.pickHistory = updatePickInHistory(state.pickHistory, payload.pickId, {
          comment: payload.comment?.trim() || undefined,
        });
        if (state.lastPick?.id === payload.pickId) {
          state.lastPick = state.pickHistory.find((p) => p.id === payload.pickId);
        }
        syncPickHistoryStorage();
        if (state.lastPick) syncLastPickStorage();
        return Promise.resolve({ ok: true } as T);
      }
      case "DELETE_PICK": {
        const payload = m.payload as { pickId: string };
        const deleted = state.pickHistory.find((p) => p.id === payload.pickId);
        state.pickHistory = removePickFromHistory(state.pickHistory, payload.pickId);
        if (state.lastPick?.id === payload.pickId && deleted) {
          state.lastPick = lastPickInSession(
            state.pickHistory,
            deleted.url,
            deleted.sessionId,
          );
        }
        syncPickHistoryStorage();
        syncLastPickStorage();
        return Promise.resolve({ ok: true } as T);
      }
      case "SET_ACTIVE_SESSION": {
        const payload = m.payload as { sessionId: string };
        const sessionPicks = state.pickHistory.filter((p) => p.sessionId === payload.sessionId);
        if (!sessionPicks.length) {
          return Promise.resolve({ ok: false, error: "Session not found" } as T);
        }
        state.sessionId = payload.sessionId;
        state.tabSessionIds = { ...state.tabSessionIds, [String(MOCK_TAB_ID)]: state.sessionId };
        state.lastPick = sessionPicks[sessionPicks.length - 1];
        emitStorage("session", {
          tabSessionIds: { newValue: { ...state.tabSessionIds }, oldValue: undefined },
          lastPick: { newValue: state.lastPick, oldValue: undefined },
        });
        return Promise.resolve({
          ok: true,
          history: sessionPicks,
          all: state.pickHistory,
          sessionId: state.sessionId,
          sessionOrder: state.tabSessionOrderIds[String(MOCK_TAB_ID)] ?? [state.sessionId],
          tabId: MOCK_TAB_ID,
        } as T);
      }
      case "DELETE_SESSION": {
        const payload = m.payload as { sessionId: string };
        state.pickHistory = clearPicksForSession(
          state.pickHistory,
          pageUrl(),
          payload.sessionId,
        );
        if (state.sessionId === payload.sessionId) {
          const remainingOrder = removeSessionFromOrder(
            state.tabSessionOrderIds[String(MOCK_TAB_ID)] ?? [],
            payload.sessionId,
          );
          state.sessionId = nextSessionIdAfterDelete(remainingOrder, newSessionId);
          state.tabSessionOrderIds = {
            ...state.tabSessionOrderIds,
            [String(MOCK_TAB_ID)]: appendSessionToOrder(remainingOrder, state.sessionId),
          };
          state.tabSessionIds = { ...state.tabSessionIds, [String(MOCK_TAB_ID)]: state.sessionId };
          state.lastPick = undefined;
        } else {
          state.tabSessionOrderIds = {
            ...state.tabSessionOrderIds,
            [String(MOCK_TAB_ID)]: removeSessionFromOrder(
              state.tabSessionOrderIds[String(MOCK_TAB_ID)] ?? [],
              payload.sessionId,
            ),
          };
        }
        syncPickHistoryStorage();
        emitStorage("session", {
          tabSessionIds: { newValue: { ...state.tabSessionIds }, oldValue: undefined },
          lastPick: { newValue: state.lastPick, oldValue: undefined },
        });
        const sessionPicks = picksForSession(
          state.pickHistory,
          pageUrl(),
          state.sessionId,
        );
        return Promise.resolve({
          ok: true,
          history: sessionPicks,
          all: state.pickHistory,
          sessionId: state.sessionId,
          sessionOrder: state.tabSessionOrderIds[String(MOCK_TAB_ID)] ?? [state.sessionId],
          tabId: MOCK_TAB_ID,
        } as T);
      }
      case "PANEL_READY":
        return Promise.resolve({
          lastPick: state.lastPick,
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
    return onPlaygroundStorageChanged(handler);
  },

  async getPageUrl() {
    return pageUrl();
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
    const state = s();
    const keyList = Array.isArray(keys) ? keys : [keys];
    const out: Record<string, unknown> = {};
    if (keyList.includes(TAB_SESSIONS_KEY)) out[TAB_SESSIONS_KEY] = state.tabSessionIds;
    if (keyList.includes("lastPick")) out.lastPick = state.lastPick;
    if (keyList.includes(HISTORY_KEY)) out[HISTORY_KEY] = state.pickHistory;
    if (keyList.includes(PICKER_ACTIVE_KEY)) out[PICKER_ACTIVE_KEY] = state.pickerActive;
    return Promise.resolve(out);
  },

  sessionSet(items: Record<string, unknown>) {
    if ("lastPick" in items) {
      const state = s();
      state.lastPick = items.lastPick as StoredPick | undefined;
      syncLastPickStorage();
    }
    return Promise.resolve();
  },

  getIconUrl(path = "public/icons/icon-32.png") {
    const file = path.replace(/^public\//, "");
    return `/${file}`;
  },
};
