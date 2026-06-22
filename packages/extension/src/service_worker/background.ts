import type {
  GripMessage,
  LogMessagePayload,
  PickerElementPayload,
} from "@grip/core";

const MAX_LOGS = 500;
const logs: LogMessagePayload[] = [];

function isInspectableUrl(url?: string): boolean {
  if (!url) return false;
  return /^https?:/i.test(url);
}

function sendToTab(tabId: number, message: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve();
    });
  });
}

async function ensureContentScripts(tabId: number): Promise<void> {
  const entry = chrome.runtime.getManifest().content_scripts?.[0];
  const files = entry?.js;
  if (!files?.length) return;
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: [...files],
  });
}

async function startPickerOnTab(tabId: number, url?: string): Promise<void> {
  if (!isInspectableUrl(url)) {
    console.warn("[Grip] Open an http(s) page first — chrome:// pages are not supported.");
    return;
  }
  try {
    await sendToTab(tabId, { type: "START_PICKER" });
  } catch {
    await ensureContentScripts(tabId);
    await sendToTab(tabId, { type: "START_PICKER" });
  }
}

chrome.runtime.onMessage.addListener((msg: GripMessage, _sender, sendResponse) => {
  switch (msg.type) {
    case "START_PICKER":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) void startPickerOnTab(tab.id, tab.url);
      });
      sendResponse({ ok: true });
      break;

    case "PICKER_ELEMENT_SELECTED":
      chrome.storage.session.set({ lastPick: msg.payload });
      sendResponse({ ok: true });
      break;

    case "LOG_ENTRY": {
      const entry = msg.payload as LogMessagePayload;
      logs.push(entry);
      if (logs.length > MAX_LOGS) logs.shift();
      chrome.storage.session.set({ logs: [...logs] });
      sendResponse({ ok: true });
      break;
    }

    case "PANEL_READY":
      chrome.storage.session.get(["lastPick", "logs"], (data) => {
        sendResponse({
          lastPick: data.lastPick as PickerElementPayload | undefined,
          logs: (data.logs as LogMessagePayload[]) ?? logs,
        });
      });
      return true;
  }
  return true;
});
