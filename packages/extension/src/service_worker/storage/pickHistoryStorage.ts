import type { PickerElementPayload, StoredPick } from "@grip/core";
import { appendPickHistory, picksForSession, toStoredPick } from "@grip/core";
import { sendToTabWhenReady } from "@/lib/tab-bridge";
import { getOrCreateSessionIdForTab } from "./sessionStorage";

export const HISTORY_KEY = "pickHistory";

export async function getPickHistory(): Promise<StoredPick[]> {
  const data = await chrome.storage.local.get(HISTORY_KEY);
  return (data[HISTORY_KEY] as StoredPick[]) ?? [];
}

export async function setPickHistory(history: StoredPick[]): Promise<void> {
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
}

export async function sessionPicksForTab(
  tabId: number,
  url: string,
): Promise<StoredPick[]> {
  const [history, sessionId] = await Promise.all([
    getPickHistory(),
    getOrCreateSessionIdForTab(tabId),
  ]);
  return picksForSession(history, url, sessionId);
}

export async function savePick(
  pick: PickerElementPayload,
  tabId?: number,
  url?: string,
  title?: string,
): Promise<StoredPick> {
  let resolvedTabId = tabId;
  if (resolvedTabId == null) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    resolvedTabId = tabs[0]?.id;
  }
  if (resolvedTabId == null) {
    throw new Error("No target tab for pick");
  }
  const sessionId = await getOrCreateSessionIdForTab(resolvedTabId);
  const stored = toStoredPick(
    pick,
    url ?? "",
    title ?? "",
    sessionId,
  );
  const history = appendPickHistory(await getPickHistory(), stored);
  await setPickHistory(history);
  await chrome.storage.session.set({ lastPick: stored });

  if (resolvedTabId) {
    try {
      await sendToTabWhenReady(resolvedTabId, { type: "SHOW_TRAY" });
    } catch {
      /* tab may not have floating mount yet */
    }
  }
  return stored;
}
