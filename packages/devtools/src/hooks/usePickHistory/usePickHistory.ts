import { useCallback, useEffect, useState } from "preact/hooks";
import { picksForSession, type StoredPick } from "@grip/core";
import type { GripRuntime } from "../../runtime/types";

interface HistoryResponse {
  history?: StoredPick[];
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
    const unsub = runtime.onStorageChanged((changes, area) => {
      if (area === "session" && changes.lastPick?.newValue) {
        const pick = changes.lastPick.newValue as StoredPick;
        setActivePick(pick);
      }
      if (area === "local" && changes.pickHistory?.newValue) {
        void runtime.sessionGet("pickSessionId").then((sessionData) => {
          void runtime.getPageUrl().then((url) => {
            const sessionId = sessionData.pickSessionId as string | undefined;
            const all = changes.pickHistory!.newValue as StoredPick[];
            const next = sessionId ? picksForSession(all, url, sessionId) : [];
            setHistory(next);
            setActivePick((prev) => {
              if (prev && next.some((p) => p.id === prev.id)) {
                return next.find((p) => p.id === prev.id) ?? prev;
              }
              return next[next.length - 1] ?? null;
            });
          });
        });
      }
      if (area === "session" && changes.pickSessionId?.newValue) {
        void refresh();
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
