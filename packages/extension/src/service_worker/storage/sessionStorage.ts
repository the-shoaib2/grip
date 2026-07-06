import { appendSessionToOrder, newSessionId } from "grip-dev";

export const TAB_SESSIONS_KEY = "tabSessionIds";
export const TAB_SESSION_ORDER_KEY = "tabSessionOrderIds";
const LEGACY_SESSION_KEY = "pickSessionId";

export async function getTabSessionMap(): Promise<Record<string, string>> {
  const data = await chrome.storage.session.get(TAB_SESSIONS_KEY);
  return (data[TAB_SESSIONS_KEY] as Record<string, string>) ?? {};
}

export async function setTabSessionMap(map: Record<string, string>): Promise<void> {
  await chrome.storage.session.set({ [TAB_SESSIONS_KEY]: map });
}

export async function getTabSessionOrderMap(): Promise<Record<string, string[]>> {
  const data = await chrome.storage.session.get(TAB_SESSION_ORDER_KEY);
  return (data[TAB_SESSION_ORDER_KEY] as Record<string, string[]>) ?? {};
}

export async function setTabSessionOrderMap(map: Record<string, string[]>): Promise<void> {
  await chrome.storage.session.set({ [TAB_SESSION_ORDER_KEY]: map });
}

export async function getOrCreateSessionOrderForTab(tabId: number): Promise<string[]> {
  const key = String(tabId);
  const [orderMap, sessionId] = await Promise.all([
    getTabSessionOrderMap(),
    getOrCreateSessionIdForTab(tabId),
  ]);
  const current = orderMap[key] ?? [];
  if (current.includes(sessionId)) return current;
  const next = appendSessionToOrder(current, sessionId);
  orderMap[key] = next;
  await setTabSessionOrderMap(orderMap);
  return next;
}

export async function getOrCreateSessionIdForTab(tabId: number): Promise<string> {
  const map = await getTabSessionMap();
  const key = String(tabId);
  const existing = map[key];
  if (existing) return existing;

  const legacyData = await chrome.storage.session.get(LEGACY_SESSION_KEY);
  const legacyId = legacyData[LEGACY_SESSION_KEY] as string | undefined;
  const id = legacyId ?? newSessionId();
  map[key] = id;
  await setTabSessionMap(map);
  if (legacyId) {
    await chrome.storage.session.remove(LEGACY_SESSION_KEY);
  }
  return id;
}

export async function clearTabSessionData(tabId: number): Promise<void> {
  const key = String(tabId);
  const [map, orderMap] = await Promise.all([
    getTabSessionMap(),
    getTabSessionOrderMap(),
  ]);
  let dirty = false;
  if (key in map) {
    delete map[key];
    dirty = true;
  }
  if (key in orderMap) {
    delete orderMap[key];
    dirty = true;
  }
  if (!dirty) return;
  await Promise.all([setTabSessionMap(map), setTabSessionOrderMap(orderMap)]);
}
