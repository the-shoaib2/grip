import { createBaseGripRuntime, promisifySend } from "@devtools/runtime/createBaseGripRuntime";

export const chromeRuntime = createBaseGripRuntime({
  sendMessage: promisifySend,

  async getPageUrl(): Promise<string> {
    if (typeof location !== "undefined" && /^https?:/i.test(location.href)) {
      return location.href;
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.url ?? "";
  },

  closeWindow() {
    window.close();
  },
});
