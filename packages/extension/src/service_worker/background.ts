import type {
  GripMessage,
  LogMessagePayload,
  PickerElementPayload,
} from "@grip/core";

const MAX_LOGS = 500;
const logs: LogMessagePayload[] = [];

chrome.runtime.onMessage.addListener(
  (msg: GripMessage, _sender, sendResponse) => {
    switch (msg.type) {
      case "START_PICKER":
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "START_PICKER" });
        });
        sendResponse({ ok: true });
        break;

      case "PICKER_ELEMENT_SELECTED":
        chrome.storage.session.set({ lastPick: msg.payload });
        chrome.runtime.sendMessage(msg).catch(() => {});
        break;

      case "LOG_ENTRY": {
        const entry = msg.payload as LogMessagePayload;
        logs.push(entry);
        if (logs.length > MAX_LOGS) logs.shift();
        chrome.storage.session.set({ logs: [...logs] });
        chrome.runtime.sendMessage(msg).catch(() => {});
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
  },
);
