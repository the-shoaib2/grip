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
  picksForSession,
  toStoredPick,
  updatePickInHistory,
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
const SESSION_KEY = "pickSessionId";
const logs: LogMessagePayload[] = [];
const bootstrapErrors = new Map<number, string>();

async function getOrCreateSessionId(): Promise<string> {
  const data = await chrome.storage.session.get(SESSION_KEY);
  const existing = data[SESSION_KEY] as string | undefined;
  if (existing) return existing;
  const id = newSessionId();
  await chrome.storage.session.set({ [SESSION_KEY]: id });
  return id;
}

async function sessionPicksForUrl(url: string): Promise<StoredPick[]> {
  const [historyData, sessionData] = await Promise.all([
    chrome.storage.local.get(HISTORY_KEY),
    chrome.storage.session.get(SESSION_KEY),
  ]);
  const history = (historyData[HISTORY_KEY] as StoredPick[]) ?? [];
  const sessionId = sessionData[SESSION_KEY] as string | undefined;
  if (!sessionId) return [];
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

  const sessionId = await getOrCreateSessionId();
  const sessionPicks = await sessionPicksForUrl(url ?? "");

  await ensureTabReady(tabId);
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
  const sessionId = await getOrCreateSessionId();
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

  if (tabId) {
    try {
      await sendToTabWhenReady(tabId, { type: "SHOW_TRAY" });
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
          const url = tab?.url ?? "";
          const history = await sessionPicksForUrl(url);
          const data = await chrome.storage.local.get(HISTORY_KEY);
          sendResponse({
            history,
            all: (data[HISTORY_KEY] as StoredPick[]) ?? [],
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
          await sendToTabWhenReady(tab.id, { type: "SHOW_TRAY" });
        } catch {
          /* ignore tray show errors */
        }
      })();
      sendResponse({ ok: true });
      return;

    case "NEW_SESSION":
      void (async () => {
        try {
          const tab = await resolveTargetTab(sender, msg);
          const url = tab?.url ?? "";
          const sessionData = await chrome.storage.session.get(SESSION_KEY);
          const currentSessionId = sessionData[SESSION_KEY] as string | undefined;
          const data = await chrome.storage.local.get(HISTORY_KEY);
          const history = currentSessionId
            ? clearPicksForSession(
                (data[HISTORY_KEY] as StoredPick[]) ?? [],
                url,
                currentSessionId,
              )
            : ((data[HISTORY_KEY] as StoredPick[]) ?? []);
          const sessionId = newSessionId();
          await chrome.storage.local.set({ [HISTORY_KEY]: history });
          await chrome.storage.session.set({ [SESSION_KEY]: sessionId });
          await chrome.storage.session.remove("lastPick");
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
