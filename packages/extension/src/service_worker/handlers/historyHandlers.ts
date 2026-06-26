import type { GripMessage, StoredPick } from "@grip/core";
import {
  lastPickInSession,
  removePickFromHistory,
  updatePickInHistory,
} from "@grip/core";
import { sendToTabWhenReady } from "@/lib/tab-bridge";
import { resolveTargetTab } from "../handlerContext";
import {
  getPickHistory,
  HISTORY_KEY,
  sessionPicksForTab,
  setPickHistory,
} from "../storage/pickHistoryStorage";
import { getOrCreateSessionIdForTab, getOrCreateSessionOrderForTab } from "../storage/sessionStorage";

export function handleGetPickHistory(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
}

export function handleNavigateToPick(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
  return false;
}

export function handleUpdatePickComment(
  msg: GripMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  void (async () => {
    try {
      const payload = msg.payload as { pickId: string; comment?: string };
      const history = updatePickInHistory(
        await getPickHistory(),
        payload.pickId,
        { comment: payload.comment?.trim() || undefined },
      );
      await setPickHistory(history);
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
}

export function handleDeletePick(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  void (async () => {
    try {
      const payload = msg.payload as { pickId: string };
      const all = await getPickHistory();
      const deleted = all.find((h) => h.id === payload.pickId);
      const history = removePickFromHistory(all, payload.pickId);
      await setPickHistory(history);
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
}
