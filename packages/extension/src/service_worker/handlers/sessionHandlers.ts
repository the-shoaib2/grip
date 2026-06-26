import type { GripMessage } from "@grip/core";
import {
  appendSessionToOrder,
  clearPicksForSession,
  newSessionId,
  nextSessionIdAfterDelete,
  picksForSession,
  removeSessionFromOrder,
} from "@grip/core";
import { resolveTargetTab } from "../handlerContext";
import {
  getPickHistory,
  sessionPicksForTab,
  setPickHistory,
} from "../storage/pickHistoryStorage";
import {
  getOrCreateSessionIdForTab,
  getOrCreateSessionOrderForTab,
  getTabSessionMap,
  getTabSessionOrderMap,
  setTabSessionMap,
  setTabSessionOrderMap,
} from "../storage/sessionStorage";

export function handleNewSession(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  void (async () => {
    try {
      const tab = await resolveTargetTab(sender, msg);
      if (!tab?.id) {
        sendResponse({ ok: false, history: [], all: [] });
        return;
      }
      const all = await getPickHistory();
      const sessionId = newSessionId();
      const [map, orderMap] = await Promise.all([
        getTabSessionMap(),
        getTabSessionOrderMap(),
      ]);
      map[String(tab.id)] = sessionId;
      const order = orderMap[String(tab.id)] ?? [];
      orderMap[String(tab.id)] = appendSessionToOrder(order, sessionId);
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
}

export function handleSetActiveSession(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  void (async () => {
    try {
      const payload = msg.payload as { sessionId: string };
      const tab = await resolveTargetTab(sender, msg);
      if (!tab?.id) {
        sendResponse({ ok: false, history: [] });
        return;
      }
      const url = tab.url ?? "";
      const all = await getPickHistory();
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
}

export function handleDeleteSession(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  void (async () => {
    try {
      const payload = msg.payload as { sessionId: string };
      const tab = await resolveTargetTab(sender, msg);
      if (!tab?.id) {
        sendResponse({ ok: false, history: [] });
        return;
      }
      const url = tab.url ?? "";
      const history = clearPicksForSession(
        await getPickHistory(),
        url,
        payload.sessionId,
      );
      await setPickHistory(history);
      const [currentSessionId, orderMap] = await Promise.all([
        getOrCreateSessionIdForTab(tab.id),
        getTabSessionOrderMap(),
      ]);
      const existingOrder = orderMap[String(tab.id)] ?? [];
      const trimmedOrder = removeSessionFromOrder(existingOrder, payload.sessionId);
      orderMap[String(tab.id)] = trimmedOrder;
      await setTabSessionOrderMap(orderMap);
      let nextSessionId = currentSessionId;
      if (payload.sessionId === currentSessionId) {
        nextSessionId = nextSessionIdAfterDelete(trimmedOrder, newSessionId);
        const [map, refreshedOrderMap] = await Promise.all([
          getTabSessionMap(),
          getTabSessionOrderMap(),
        ]);
        map[String(tab.id)] = nextSessionId;
        const nextOrder = refreshedOrderMap[String(tab.id)] ?? [];
        refreshedOrderMap[String(tab.id)] = appendSessionToOrder(nextOrder, nextSessionId);
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
}
