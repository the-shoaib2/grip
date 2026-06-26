import type { GripMessage, PickerElementPayload, StoredPick } from "@grip/core";
import {
  ensureTabReady,
  sendToTab,
  sendToTabWhenReady,
  waitForBootstrap,
} from "@/lib/tab-bridge";
import { isInspectableUrl, respondError, resolveTargetTab } from "../handlerContext";
import { savePick, sessionPicksForTab } from "../storage/pickHistoryStorage";
import { getOrCreateSessionIdForTab } from "../storage/sessionStorage";

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

export function handleStartPicker(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
}

export function handleStopPicker(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
}

export function handlePickerElementSelected(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
}
