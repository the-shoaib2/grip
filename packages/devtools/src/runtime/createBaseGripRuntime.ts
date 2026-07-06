import { checkChromeDebugPort, GRIP_MCP_DOCS_URL } from "grip-dev";
import type { GripRuntime, RuntimeMessage, StorageChangeHandler } from "@devtools/runtime/types/types";

export function promisifySend<T>(msg: RuntimeMessage): Promise<T> {
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

type BaseRuntimeOverrides = Pick<GripRuntime, "sendMessage" | "getPageUrl"> &
  Partial<Pick<GripRuntime, "getTargetTabId" | "closeWindow">>;

export function createBaseGripRuntime(overrides: BaseRuntimeOverrides): GripRuntime {
  return {
    sendMessage: overrides.sendMessage,
    getPageUrl: overrides.getPageUrl,
    getTargetTabId: overrides.getTargetTabId,
    closeWindow: overrides.closeWindow,

    onStorageChanged(handler: StorageChangeHandler) {
      chrome.storage.onChanged.addListener(handler);
      return () => chrome.storage.onChanged.removeListener(handler);
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
}
