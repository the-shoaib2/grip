import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { picksForSession, type StoredPick } from "@grip/core";
import type { GripRuntime } from "../../runtime/types";

interface HistoryResponse {
  history?: StoredPick[];
  sessionId?: string;
  tabId?: number;
}

async function sessionIdForRuntime(runtime: GripRuntime): Promise<string | undefined> {
  const tabId = runtime.getTargetTabId?.();
  const data = await runtime.sessionGet("tabSessionIds");
  const map = (data.tabSessionIds as Record<string, string> | undefined) ?? {};
  if (tabId != null) return map[String(tabId)];
  const keys = Object.keys(map);
  return keys.length === 1 ? map[keys[0]] : undefined;
}

export interface UsePickHistoryResult {
  history: StoredPick[];
  activePick: StoredPick | null;
  setActivePick: (pick: StoredPick | null) => void;
  refresh: () => Promise<void>;
  newSession: () => Promise<void>;
  selectPick: (pick: StoredPick) => void;
}

export function usePickHistory(runtime: GripRuntime): UsePickHistoryResult {
  const [history, setHistory] = useState<StoredPick[]>([]);
  const [activePick, setActivePick] = useState<StoredPick | null>(null);
  const inspectedTabRef = useRef<number | undefined>(runtime.getTargetTabId?.());

  const refresh = useCallback(async () => {
    try {
      const data = await runtime.sendMessage<HistoryResponse>({
        type: "GET_PICK_HISTORY",
      });
      const items = data?.history ?? [];
      setHistory(items);
      setActivePick((prev) => {
        if (prev && items.some((p) => p.id === prev.id)) return prev;
        return items[items.length - 1] ?? null;
      });
    } catch {
      /* ignore */
    }
  }, [runtime]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    if (!runtime.getTargetTabId) return;

    const poll = window.setInterval(() => {
      const current = runtime.getTargetTabId?.();
      if (current == null || current === inspectedTabRef.current) return;
      inspectedTabRef.current = current;
      void refresh();
    }, 400);

    return () => window.clearInterval(poll);
  }, [runtime, refresh]);

  useEffect(() => {
    const unsub = runtime.onStorageChanged((changes, area) => {
      if (area === "session" && changes.lastPick?.newValue) {
        const pick = changes.lastPick.newValue as StoredPick;
        setActivePick(pick);
      }
      if (area === "local" && changes.pickHistory?.newValue) {
        void (async () => {
          const sessionId = await sessionIdForRuntime(runtime);
          if (!sessionId) {
            void refresh();
            return;
          }
          const url = await runtime.getPageUrl();
          const all = changes.pickHistory!.newValue as StoredPick[];
          const next = picksForSession(all, url, sessionId);
          setHistory(next);
          setActivePick((prev) => {
            if (prev && next.some((p) => p.id === prev.id)) {
              return next.find((p) => p.id === prev.id) ?? prev;
            }
            return next[next.length - 1] ?? null;
          });
        })();
      }
      if (area === "session" && changes.tabSessionIds?.newValue) {
        const tabId = runtime.getTargetTabId?.();
        if (tabId == null) {
          void refresh();
          return;
        }
        const map = changes.tabSessionIds.newValue as Record<string, string>;
        if (map[String(tabId)]) void refresh();
      }
    });
    return unsub;
  }, [runtime, refresh]);

  const newSession = useCallback(async () => {
    try {
      const data = await runtime.sendMessage<HistoryResponse>({
        type: "NEW_SESSION",
      });
      const items = data?.history ?? [];
      setHistory(items);
      setActivePick(null);
    } catch {
      /* ignore */
    }
  }, [runtime]);

  const selectPick = useCallback(
    (pick: StoredPick) => {
      setActivePick(pick);
      void runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick });
    },
    [runtime],
  );

  return {
    history,
    activePick,
    setActivePick,
    refresh,
    newSession,
    selectPick,
  };
}
