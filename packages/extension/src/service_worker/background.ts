import type {
  GripMessage,
  LogMessagePayload,
  PickerElementPayload,
  StoredPick,
} from "@grip/core";
import { appendPickHistory, clearPicksForUrl, picksForUrl, toStoredPick } from "@grip/core";
import { gripUserError } from "@/lib/errors";
import {
  ensureTabReady,
  sendToTab,
  sendToTabWhenReady,
} from "@/lib/tab-bridge";

const MAX_LOGS = 500;
const HISTORY_KEY = "pickHistory";
const logs: LogMessagePayload[] = [];

function isInspectableUrl(url?: string): boolean {
  if (!url) return false;
  return /^https?:/i.test(url);
}

async function pushTrayToTab(tabId: number, picks: StoredPick[]): Promise<void> {
  try {
    await sendToTab(tabId, { type: "UPDATE_TRAY_PICKS", payload: picks });
  } catch {
    /* tab may not have scripts yet */
  }
}

async function startPickerOnTab(tabId: number, url?: string): Promise<void> {
  if (!isInspectableUrl(url)) {
    throw new Error("Open an http(s) page first");
  }

  await ensureTabReady(tabId);
  await sendToTab(tabId, { type: "START_PICKER" });
}

async function savePick(
  pick: PickerElementPayload,
  tabId?: number,
  url?: string,
  title?: string,
): Promise<StoredPick> {
  const stored = toStoredPick(
    pick,
    url ?? "",
    title ?? "",
  );
  const data = await chrome.storage.local.get(HISTORY_KEY);
  const history = appendPickHistory(
    (data[HISTORY_KEY] as StoredPick[]) ?? [],
    stored,
  );
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
  await chrome.storage.session.set({ lastPick: stored });

  if (tabId && url) {
    const pagePicks = picksForUrl(history, url);
    await pushTrayToTab(tabId, pagePicks);
  }
  return stored;
}

function respondError(
  sendResponse: (response: { ok: false; error: string }) => void,
  err: unknown,
): void {
  try {
    sendResponse({
      ok: false,
      error: gripUserError(err instanceof Error ? err.message : undefined),
    });
  } catch {
    // Receiver closed before error was sent.
  }
}

chrome.runtime.onMessage.addListener((msg: GripMessage, sender, sendResponse) => {
  switch (msg.type) {
    case "START_PICKER":
      void (async () => {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          if (!tab?.id) {
            sendResponse({ ok: false, error: "No active tab" });
            return;
          }
          await startPickerOnTab(tab.id, tab.url);
          sendResponse({ ok: true });
        } catch (err) {
          respondError(sendResponse, err);
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        if (!tab?.id) return;
        try {
          await sendToTabWhenReady(tab.id, { type: "NAVIGATE_TO_PICK", payload: pick });
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
          const data = await chrome.storage.local.get(HISTORY_KEY);
          const history = (data[HISTORY_KEY] as StoredPick[]) ?? [];
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const url = tabs[0]?.url ?? "";
          sendResponse({ history: picksForUrl(history, url), all: history });
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        if (!tab?.id) return;
        try {
          await sendToTabWhenReady(tab.id, { type: "TOGGLE_GRIP_TRAY" });
        } catch {
          /* ignore tray toggle errors */
        }
      })();
      sendResponse({ ok: true });
      return;

    case "NEW_SESSION":
      void (async () => {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          const url = tab?.url ?? "";
          const data = await chrome.storage.local.get(HISTORY_KEY);
          const history = clearPicksForUrl(
            (data[HISTORY_KEY] as StoredPick[]) ?? [],
            url,
          );
          await chrome.storage.local.set({ [HISTORY_KEY]: history });
          await chrome.storage.session.remove("lastPick");
          if (tab?.id) await pushTrayToTab(tab.id, []);
          sendResponse({ ok: true, history: [] });
        } catch {
          try {
            sendResponse({ ok: false, history: [] });
          } catch {
            // Receiver closed before session was cleared.
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
  }
});

chrome.tabs.onActivated.addListener(() => {
  void chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    if (!tab?.id || !isInspectableUrl(tab.url)) return;
    const data = await chrome.storage.local.get(HISTORY_KEY);
    const history = (data[HISTORY_KEY] as StoredPick[]) ?? [];
    const pagePicks = picksForUrl(history, tab.url ?? "");
    await pushTrayToTab(tab.id, pagePicks);
  });
});

chrome.runtime.onInstalled.addListener(() => {
  void chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }, async (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        await ensureTabReady(tab.id);
      } catch {
        /* tab may be restricted */
      }
    }
  });
});
