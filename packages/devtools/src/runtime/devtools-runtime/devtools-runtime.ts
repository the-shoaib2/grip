import { createBaseGripRuntime, promisifySend } from "../createBaseGripRuntime";
import type { RuntimeMessage } from "../types";

function inspectedTabId(): number | undefined {
  const id = chrome.devtools?.inspectedWindow?.tabId;
  return typeof id === "number" ? id : undefined;
}

export const devtoolsRuntime = createBaseGripRuntime({
  sendMessage(msg: RuntimeMessage) {
    const tabId = inspectedTabId();
    return promisifySend(tabId != null ? { ...msg, tabId } : msg);
  },

  async getPageUrl(): Promise<string> {
    const tabId = inspectedTabId();
    if (tabId != null) {
      try {
        const tab = await chrome.tabs.get(tabId);
        return tab.url ?? "";
      } catch {
        /* fall through */
      }
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.url ?? "";
  },

  getTargetTabId() {
    return inspectedTabId();
  },
});
