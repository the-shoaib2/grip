import type {
  GripMessage,
  LogMessagePayload,
  PickerElementPayload,
  StoredPick,
} from "@grip/core";
import {
  appendPickHistory,
  clearPicksForSession,
  newSessionId,
  lastPickInSession,
  picksForSession,
  toStoredPick,
  updatePickInHistory,
  removePickFromHistory,
} from "@grip/core";
import { gripUserError } from "@/lib/errors";
import {
  ensureTabReady,
  registerGripContentScripts,
  sendToTab,
  sendToTabWhenReady,
  waitForBootstrap,
  warmTab,
} from "@/lib/tab-bridge";

const MAX_LOGS = 500;
const HISTORY_KEY = "pickHistory";
const TAB_SESSIONS_KEY = "tabSessionIds";
const TAB_SESSION_ORDER_KEY = "tabSessionOrderIds";
const LEGACY_SESSION_KEY = "pickSessionId";
const logs: LogMessagePayload[] = [];
const bootstrapErrors = new Map<number, string>();

async function getTabSessionMap(): Promise<Record<string, string>> {
  const data = await chrome.storage.session.get(TAB_SESSIONS_KEY);
  return (data[TAB_SESSIONS_KEY] as Record<string, string>) ?? {};
}

async function setTabSessionMap(map: Record<string, string>): Promise<void> {
  await chrome.storage.session.set({ [TAB_SESSIONS_KEY]: map });
}

async function getTabSessionOrderMap(): Promise<Record<string, string[]>> {
  const data = await chrome.storage.session.get(TAB_SESSION_ORDER_KEY);
  return (data[TAB_SESSION_ORDER_KEY] as Record<string, string[]>) ?? {};
}

async function setTabSessionOrderMap(map: Record<string, string[]>): Promise<void> {
  await chrome.storage.session.set({ [TAB_SESSION_ORDER_KEY]: map });
}

async function getOrCreateSessionOrderForTab(tabId: number): Promise<string[]> {
  const key = String(tabId);
  const [orderMap, sessionId] = await Promise.all([
    getTabSessionOrderMap(),
    getOrCreateSessionIdForTab(tabId),
  ]);
  const current = orderMap[key] ?? [];
  if (current.includes(sessionId)) return current;
  const next = [...current, sessionId];
  orderMap[key] = next;
  await setTabSessionOrderMap(orderMap);
  return next;
}

async function getOrCreateSessionIdForTab(tabId: number): Promise<string> {
  const map = await getTabSessionMap();
  const key = String(tabId);
  const existing = map[key];
  if (existing) return existing;

  const legacyData = await chrome.storage.session.get(LEGACY_SESSION_KEY);
  const legacyId = legacyData[LEGACY_SESSION_KEY] as string | undefined;
  const id = legacyId ?? newSessionId();
  map[key] = id;
  await setTabSessionMap(map);
  if (legacyId) {
    await chrome.storage.session.remove(LEGACY_SESSION_KEY);
  }
  return id;
}

async function sessionPicksForTab(
  tabId: number,
  url: string,
): Promise<StoredPick[]> {
  const [historyData, sessionId] = await Promise.all([
    chrome.storage.local.get(HISTORY_KEY),
    getOrCreateSessionIdForTab(tabId),
  ]);
  const history = (historyData[HISTORY_KEY] as StoredPick[]) ?? [];
  return picksForSession(history, url, sessionId);
}

function isInspectableUrl(url?: string): boolean {
  if (!url) return false;
  return /^https?:/i.test(url);
}

async function resolveTargetTab(
  sender: chrome.runtime.MessageSender,
  msg: GripMessage,
): Promise<chrome.tabs.Tab | undefined> {
  if (sender.tab?.id) return sender.tab;

  if (typeof msg.tabId === "number") {
    try {
      return await chrome.tabs.get(msg.tabId);
    } catch {
      /* fall through */
    }
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function startPickerOnTab(tabId: number, url?: string): Promise<void> {
  if (!isInspectableUrl(url)) {
    throw new Error("Open an http(s) page first");
  }

  const sessionId = await getOrCreateSessionIdForTab(tabId);
  const sessionPicks = await sessionPicksForTab(tabId, url ?? "");

  await ensureTabReady(tabId);
  try {
    await sendToTabWhenReady(tabId, { type: "HIDE_TRAY" }, { feature: "floating" });
  } catch {
    /* floating tray may not be mounted */
  }
  await waitForBootstrap(tabId, "picker");
  await sendToTab(tabId, {
    type: "START_PICKER",
    payload: {
      sessionId,
      sessionPickCount: sessionPicks.length,
    },
  });
}

async function savePick(
  pick: PickerElementPayload,
  tabId?: number,
  url?: string,
  title?: string,
): Promise<StoredPick> {
  let resolvedTabId = tabId;
  if (resolvedTabId == null) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    resolvedTabId = tabs[0]?.id;
  }
  if (resolvedTabId == null) {
    throw new Error("No target tab for pick");
  }
  const sessionId = await getOrCreateSessionIdForTab(resolvedTabId);
  const stored = toStoredPick(
    pick,
    url ?? "",
    title ?? "",
    sessionId,
  );
  const data = await chrome.storage.local.get(HISTORY_KEY);
  const history = appendPickHistory(
    (data[HISTORY_KEY] as StoredPick[]) ?? [],
    stored,
  );
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
  await chrome.storage.session.set({ lastPick: stored });

  if (resolvedTabId) {
    try {
      await sendToTabWhenReady(resolvedTabId, { type: "SHOW_TRAY" });
    } catch {
      /* tab may not have floating mount yet */
    }
  }
  return stored;
}

function respondError(
  sendResponse: (response: { ok: false; error: string }) => void,
  err: unknown,
  tabId?: number,
): void {
  try {
    let message = err instanceof Error ? err.message : undefined;
    const bootstrapErr = tabId != null ? bootstrapErrors.get(tabId) : undefined;
    if (bootstrapErr) {
      message = message
        ? `${message}: ${bootstrapErr}`
        : `GRIP_BOOTSTRAP_FAILED: ${bootstrapErr}`;
    }
    sendResponse({
      ok: false,
      error: message ?? "GRIP_SHELL_UNAVAILABLE",
    });
  } catch {
    // Receiver closed before error was sent.
  }
}

chrome.runtime.onMessage.addListener((msg: GripMessage, sender, sendResponse) => {
  switch (msg.type) {
    case "START_PICKER":
      void (async () => {
        let tab: chrome.tabs.Tab | undefined;
        try {
          tab = await resolveTargetTab(sender, msg);
          if (!tab?.id) {
            sendResponse({ ok: false, error: "No active tab" });
            return;
          }
          await startPickerOnTab(tab.id, tab.url);
          sendResponse({ ok: true });
        } catch (err) {
          respondError(sendResponse, err, tab?.id);
        }
      })();
      return true;

    case "STOP_PICKER":
      void (async () => {
        let tab: chrome.tabs.Tab | undefined;
        try {
          tab = await resolveTargetTab(sender, msg);
          if (!tab?.id) {
            sendResponse({ ok: false, error: "No active tab" });
            return;
          }
          await ensureTabReady(tab.id);
          await sendToTab(tab.id, { type: "STOP_PICKER" });
          sendResponse({ ok: true });
        } catch (err) {
          respondError(sendResponse, err, tab?.id);
        }
      })();
      return true;

    case "PICKER_ELEMENT_SELECTED":
      void (async () => {
        try {
          const tabId = sender.tab?.id;
          const url = sender.tab?.url ?? (msg.payload as StoredPick).url;
          const title = sender.tab?.title ?? (msg.payload as StoredPick).pageTitle;
          const stored = await savePick(
            msg.payload as PickerElementPayload,
            tabId,
            url,
            title,
          );
          sendResponse({ ok: true, pick: stored });
        } catch {
          try {
            sendResponse({ ok: false });
          } catch {
            // Receiver closed before pick was saved.
          }
        }
      })();
      return true;

    case "NAVIGATE_TO_PICK": {
      const pick = msg.payload as StoredPick;
      void (async () => {
        const tab = await resolveTargetTab(sender, msg);
        if (!tab?.id) return;
        try {
          await sendToTabWhenReady(tab.id, {
            type: "NAVIGATE_TO_PICK",
            payload: pick,
          });
        } catch {
          /* ignore navigation errors */
        }
        await chrome.storage.session.set({ lastPick: pick });
      })();
      sendResponse({ ok: true });
      return;
    }

    case "GET_PICK_HISTORY":
      void (async () => {
        try {
          const tab = await resolveTargetTab(sender, msg);
          if (!tab?.id) {
            sendResponse({ history: [], all: [] });
            return;
          }
          const url = tab.url ?? "";
          const history = await sessionPicksForTab(tab.id, url);
          const data = await chrome.storage.local.get(HISTORY_KEY);
          sendResponse({
            history,
            all: (data[HISTORY_KEY] as StoredPick[]) ?? [],
            sessionId: await getOrCreateSessionIdForTab(tab.id),
            sessionOrder: await getOrCreateSessionOrderForTab(tab.id),
            tabId: tab.id,
          });
        } catch {
          try {
            sendResponse({ history: [], all: [] });
          } catch {
            // Receiver closed before history was read.
          }
        }
      })();
      return true;

    case "TOGGLE_GRIP_TRAY":
      void (async () => {
        const tab = await resolveTargetTab(sender, msg);
        if (!tab?.id) return;
        try {
          await sendToTabWhenReady(tab.id, { type: "TOGGLE_GRIP_TRAY" });
        } catch {
          /* ignore tray toggle errors */
        }
      })();
      sendResponse({ ok: true });
      return;

    case "SHOW_TRAY":
      void (async () => {
        const tab = await resolveTargetTab(sender, msg);
        if (!tab?.id) return;
        try {
          await sendToTabWhenReady(tab.id, {
            type: "SHOW_TRAY",
            payload: msg.payload,
          });
        } catch {
          /* ignore tray show errors */
        }
      })();
      sendResponse({ ok: true });
      return;

    case "HIDE_TRAY":
      void (async () => {
        const tab = await resolveTargetTab(sender, msg);
        if (!tab?.id) return;
        try {
          await sendToTabWhenReady(tab.id, { type: "HIDE_TRAY" });
        } catch {
          /* ignore tray hide errors */
        }
      })();
      sendResponse({ ok: true });
      return;

    case "NEW_SESSION":
      void (async () => {
        try {
          const tab = await resolveTargetTab(sender, msg);
          if (!tab?.id) {
            sendResponse({ ok: false, history: [], all: [] });
            return;
          }
          const data = await chrome.storage.local.get(HISTORY_KEY);
          const all = (data[HISTORY_KEY] as StoredPick[]) ?? [];
          const sessionId = newSessionId();
          const [map, orderMap] = await Promise.all([
            getTabSessionMap(),
            getTabSessionOrderMap(),
          ]);
          map[String(tab.id)] = sessionId;
          const order = orderMap[String(tab.id)] ?? [];
          orderMap[String(tab.id)] = order.includes(sessionId)
            ? order
            : [...order, sessionId];
          await setTabSessionMap(map);
          await setTabSessionOrderMap(orderMap);
          await chrome.storage.session.remove("lastPick");
          sendResponse({
            ok: true,
            history: [],
            all,
            sessionId,
            sessionOrder: orderMap[String(tab.id)],
            tabId: tab.id,
          });
        } catch {
          try {
            sendResponse({ ok: false, history: [], all: [] });
          } catch {
            // Receiver closed before session was cleared.
          }
        }
      })();
      return true;

    case "OPEN_CONTEXT_EDITOR": {
      const payload = msg.payload;
      void (async () => {
        const tab = await resolveTargetTab(sender, msg);
        if (!tab?.id) return;
        try {
          await sendToTabWhenReady(tab.id, {
            type: "OPEN_CONTEXT_EDITOR",
            payload,
          });
        } catch {
          /* ignore editor open errors */
        }
      })();
      sendResponse({ ok: true });
      return true;
    }

    case "UPDATE_PICK_COMMENT":
      void (async () => {
        try {
          const payload = msg.payload as { pickId: string; comment?: string };
          const data = await chrome.storage.local.get(HISTORY_KEY);
          const history = updatePickInHistory(
            (data[HISTORY_KEY] as StoredPick[]) ?? [],
            payload.pickId,
            { comment: payload.comment?.trim() || undefined },
          );
          await chrome.storage.local.set({ [HISTORY_KEY]: history });
          const updated = history.find((h) => h.id === payload.pickId);
          if (updated) {
            const sessionData = await chrome.storage.session.get("lastPick");
            const lastPick = sessionData.lastPick as StoredPick | undefined;
            if (lastPick?.id === payload.pickId) {
              await chrome.storage.session.set({ lastPick: updated });
            }
          }
          sendResponse({ ok: true, pick: updated });
        } catch {
          try {
            sendResponse({ ok: false });
          } catch {
            /* receiver closed */
          }
        }
      })();
      return true;

    case "DELETE_PICK":
      void (async () => {
        try {
          const payload = msg.payload as { pickId: string };
          const data = await chrome.storage.local.get(HISTORY_KEY);
          const all = (data[HISTORY_KEY] as StoredPick[]) ?? [];
          const deleted = all.find((h) => h.id === payload.pickId);
          const history = removePickFromHistory(all, payload.pickId);
          await chrome.storage.local.set({ [HISTORY_KEY]: history });
          const sessionData = await chrome.storage.session.get("lastPick");
          const lastPick = sessionData.lastPick as StoredPick | undefined;
          if (lastPick?.id === payload.pickId && deleted) {
            const tab = await resolveTargetTab(sender, msg);
            const url = tab?.url ?? deleted.url;
            const remaining = lastPickInSession(history, url, deleted.sessionId);
            if (remaining) {
              await chrome.storage.session.set({ lastPick: remaining });
            } else {
              await chrome.storage.session.remove("lastPick");
            }
          }
          sendResponse({ ok: true });
        } catch {
          try {
            sendResponse({ ok: false });
          } catch {
            /* receiver closed */
          }
        }
      })();
      return true;

    case "SET_ACTIVE_SESSION":
      void (async () => {
        try {
          const payload = msg.payload as { sessionId: string };
          const tab = await resolveTargetTab(sender, msg);
          if (!tab?.id) {
            sendResponse({ ok: false, history: [] });
            return;
          }
          const url = tab.url ?? "";
          const data = await chrome.storage.local.get(HISTORY_KEY);
          const all = (data[HISTORY_KEY] as StoredPick[]) ?? [];
          const order = await getOrCreateSessionOrderForTab(tab.id);
          const sessionPicks = picksForSession(all, url, payload.sessionId);
          if (!sessionPicks.length && !order.includes(payload.sessionId)) {
            sendResponse({ ok: false, error: "Session not found" });
            return;
          }
          const map = await getTabSessionMap();
          map[String(tab.id)] = payload.sessionId;
          await setTabSessionMap(map);
          const last = sessionPicks[sessionPicks.length - 1];
          if (last) {
            await chrome.storage.session.set({ lastPick: last });
          } else {
            await chrome.storage.session.remove("lastPick");
          }
          sendResponse({
            ok: true,
            history: sessionPicks,
            all,
            sessionId: payload.sessionId,
            sessionOrder: order,
            tabId: tab.id,
          });
        } catch {
          try {
            sendResponse({ ok: false, history: [], all: [] });
          } catch {
            /* receiver closed */
          }
        }
      })();
      return true;

    case "DELETE_SESSION":
      void (async () => {
        try {
          const payload = msg.payload as { sessionId: string };
          const tab = await resolveTargetTab(sender, msg);
          if (!tab?.id) {
            sendResponse({ ok: false, history: [] });
            return;
          }
          const url = tab.url ?? "";
          const data = await chrome.storage.local.get(HISTORY_KEY);
          const history = clearPicksForSession(
            (data[HISTORY_KEY] as StoredPick[]) ?? [],
            url,
            payload.sessionId,
          );
          await chrome.storage.local.set({ [HISTORY_KEY]: history });
          const [currentSessionId, orderMap] = await Promise.all([
            getOrCreateSessionIdForTab(tab.id),
            getTabSessionOrderMap(),
          ]);
          const existingOrder = orderMap[String(tab.id)] ?? [];
          const trimmedOrder = existingOrder.filter((id) => id !== payload.sessionId);
          orderMap[String(tab.id)] = trimmedOrder;
          await setTabSessionOrderMap(orderMap);
          let nextSessionId = currentSessionId;
          if (payload.sessionId === currentSessionId) {
            nextSessionId = trimmedOrder[trimmedOrder.length - 1] ?? newSessionId();
            const [map, refreshedOrderMap] = await Promise.all([
              getTabSessionMap(),
              getTabSessionOrderMap(),
            ]);
            map[String(tab.id)] = nextSessionId;
            const nextOrder = refreshedOrderMap[String(tab.id)] ?? [];
            refreshedOrderMap[String(tab.id)] = nextOrder.includes(nextSessionId)
              ? nextOrder
              : [...nextOrder, nextSessionId];
            await setTabSessionMap(map);
            await setTabSessionOrderMap(refreshedOrderMap);
            const sessionPicks = picksForSession(history, url, nextSessionId);
            const last = sessionPicks[sessionPicks.length - 1];
            if (last) {
              await chrome.storage.session.set({ lastPick: last });
            } else {
              await chrome.storage.session.remove("lastPick");
            }
          }
          const sessionHistory = await sessionPicksForTab(tab.id, url);
          const finalOrder = await getOrCreateSessionOrderForTab(tab.id);
          sendResponse({
            ok: true,
            history: sessionHistory,
            all: history,
            sessionId: nextSessionId,
            sessionOrder: finalOrder,
            tabId: tab.id,
          });
        } catch {
          try {
            sendResponse({ ok: false, history: [], all: [] });
          } catch {
            /* receiver closed */
          }
        }
      })();
      return true;

    case "LOG_ENTRY": {
      const entry = msg.payload as LogMessagePayload;
      logs.push(entry);
      if (logs.length > MAX_LOGS) logs.shift();
      chrome.storage.session.set({ logs: [...logs] });
      sendResponse({ ok: true });
      return;
    }

    case "PANEL_READY":
      void (async () => {
        try {
          const data = await chrome.storage.session.get(["lastPick", "logs"]);
          sendResponse({
            lastPick: data.lastPick as PickerElementPayload | undefined,
            logs: (data.logs as LogMessagePayload[]) ?? logs,
          });
        } catch {
          // Receiver closed before storage read finished.
        }
      })();
      return true;

    case "GRIP_PING":
      sendResponse({ ok: true });
      return true;

    case "GRIP_BOOTSTRAP_ERROR": {
      const tabId = sender.tab?.id;
      const payload = msg.payload as { message?: string } | undefined;
      if (tabId && payload?.message) {
        bootstrapErrors.set(tabId, payload.message);
      }
      sendResponse({ ok: true });
      return true;
    }
  }
});

async function bootstrapExistingTabs(): Promise<void> {
  try {
    await registerGripContentScripts();
  } catch {
    /* registration may fail in restricted contexts */
  }

  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const tab of tabs) {
    if (!tab.id) continue;
    void warmTab(tab.id, tab.url);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void bootstrapExistingTabs();
});

chrome.runtime.onStartup.addListener(() => {
  void bootstrapExistingTabs();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    void warmTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs.get(tabId).then((tab) => warmTab(tabId, tab.url)).catch(() => {
    /* tab may have closed */
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void (async () => {
    const key = String(tabId);
    const [map, orderMap] = await Promise.all([
      getTabSessionMap(),
      getTabSessionOrderMap(),
    ]);
    let dirty = false;
    if (key in map) {
      delete map[key];
      dirty = true;
    }
    if (key in orderMap) {
      delete orderMap[key];
      dirty = true;
    }
    if (!dirty) return;
    await Promise.all([setTabSessionMap(map), setTabSessionOrderMap(orderMap)]);
  })();
});
