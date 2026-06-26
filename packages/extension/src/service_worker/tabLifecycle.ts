import { registerGripContentScripts, warmTab } from "@/lib/tab-bridge";
import { clearTabSessionData } from "./storage/sessionStorage";

export async function bootstrapExistingTabs(): Promise<void> {
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

export function registerTabLifecycleListeners(): void {
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

  chrome.tabs.onRemoved.addListener((tabId) => {
    void clearTabSessionData(tabId);
  });
}
