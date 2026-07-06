import type { StoredPick } from "grip-dev";
import type { StorageChangeHandler } from "@grip/devtools";

const STATE_KEY = "__gripPlaygroundState__";
const LISTENERS_KEY = "__gripPlaygroundStorageListeners__";

export interface PlaygroundState {
  pickerActive: boolean;
  sessionId: string;
  tabSessionIds: Record<string, string>;
  tabSessionOrderIds: Record<string, string[]>;
  pickHistory: StoredPick[];
  lastPick?: StoredPick;
}

function defaultState(): PlaygroundState {
  const sessionId = "playground-session";
  return {
    pickerActive: false,
    sessionId,
    tabSessionIds: { "1": sessionId },
    tabSessionOrderIds: { "1": [sessionId] },
    pickHistory: [],
    lastPick: undefined,
  };
}

export function getPlaygroundState(): PlaygroundState {
  const win = window as typeof window & { [STATE_KEY]?: PlaygroundState };
  if (!win[STATE_KEY]) {
    win[STATE_KEY] = defaultState();
  }
  return win[STATE_KEY]!;
}

function getStorageListeners(): Set<StorageChangeHandler> {
  const win = window as typeof window & { [LISTENERS_KEY]?: Set<StorageChangeHandler> };
  if (!win[LISTENERS_KEY]) {
    win[LISTENERS_KEY] = new Set();
  }
  return win[LISTENERS_KEY]!;
}

export function emitPlaygroundStorage(
  area: "local" | "session",
  changes: Record<string, chrome.storage.StorageChange>,
): void {
  for (const handler of getStorageListeners()) {
    handler(changes, area);
  }
}

export function onPlaygroundStorageChanged(handler: StorageChangeHandler): () => void {
  const listeners = getStorageListeners();
  listeners.add(handler);
  return () => listeners.delete(handler);
}
