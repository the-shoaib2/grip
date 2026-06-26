import type { GripMessage, LogMessagePayload, PickerElementPayload } from "@grip/core";
import { sendToTabWhenReady } from "@/lib/tab-bridge";
import { bootstrapErrors, logs, MAX_LOGS, resolveTargetTab } from "../handlerContext";

export function handleToggleGripTray(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
  return false;
}

export function handleShowTray(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
  return false;
}

export function handleHideTray(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
  return false;
}

export function handleOpenContextEditor(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
  return false;
}

export function handleLogEntry(
  msg: GripMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  const entry = msg.payload as LogMessagePayload;
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
  chrome.storage.session.set({ logs: [...logs] });
  sendResponse({ ok: true });
  return false;
}

export function handlePanelReady(
  _msg: GripMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
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
}

export function handleGripPing(
  _msg: GripMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  sendResponse({ ok: true });
  return false;
}

export function handleGripBootstrapError(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  const tabId = sender.tab?.id;
  const payload = msg.payload as { message?: string } | undefined;
  if (tabId && payload?.message) {
    bootstrapErrors.set(tabId, payload.message);
  }
  sendResponse({ ok: true });
  return false;
}
