import { checkChromeDebugPort, GRIP_MCP_DOCS_URL } from "@grip/core";
import type { RuntimeMessage } from "../types";
import type { GripRuntime, StorageChangeHandler } from "../types";

function promisifySend<T>(msg: RuntimeMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(msg, (response: T) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function inspectedTabId(): number | undefined {
  const id = chrome.devtools?.inspectedWindow?.tabId;
  return typeof id === "number" ? id : undefined;
}

export const devtoolsRuntime: GripRuntime = {
  sendMessage(msg) {
    const tabId = inspectedTabId();
    return promisifySend(tabId != null ? { ...msg, tabId } : msg);
  },

  onStorageChanged(handler: StorageChangeHandler) {
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
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

  checkMcp() {
    return checkChromeDebugPort();
  },

  openMcpDocs() {
    void chrome.tabs.create({ url: GRIP_MCP_DOCS_URL });
  },

  sessionGet(keys: string | string[]) {
    return chrome.storage.session.get(keys) as Promise<Record<string, unknown>>;
  },

  sessionSet(items: Record<string, unknown>) {
    return chrome.storage.session.set(items);
  },

  getIconUrl(path = "public/icons/icon-32.png") {
    return chrome.runtime.getURL(path);
  },
};
