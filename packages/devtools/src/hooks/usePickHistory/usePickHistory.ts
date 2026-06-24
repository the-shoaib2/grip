import { createContext } from "preact";
import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
import {
  groupPicksBySession,
  type SessionPickGroup,
  type StoredPick,
} from "@grip/core";
import type { GripRuntime } from "../../runtime/types";

export const PickHistoryContext = createContext<UsePickHistoryResult | null>(null);

interface HistoryResponse {
  history?: StoredPick[];
  all?: StoredPick[];
  sessionOrder?: string[];
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
  sessionGroups: SessionPickGroup[];
  sessionOrder: string[];
  activeSessionId: string | null;
  activePick: StoredPick | null;
  setActivePick: (pick: StoredPick | null) => void;
  refresh: () => Promise<void>;
  newSession: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  selectPick: (pick: StoredPick) => void;
  savePickComment: (pickId: string, comment: string) => Promise<void>;
  deletePick: (pickId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export function usePickHistory(): UsePickHistoryResult {
  const value = useContext(PickHistoryContext);
  if (!value) {
    throw new Error("usePickHistory must be used within GripRuntimeProvider");
  }
  return value;
}

export function usePickHistoryState(runtime: GripRuntime): UsePickHistoryResult {
  const [history, setHistory] = useState<StoredPick[]>([]);
  const [allHistory, setAllHistory] = useState<StoredPick[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionGroups, setSessionGroups] = useState<SessionPickGroup[]>([]);
  const [sessionOrder, setSessionOrder] = useState<string[]>([]);
  const [activePick, setActivePick] = useState<StoredPick | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const inspectedTabRef = useRef<number | undefined>(runtime.getTargetTabId?.());
  const allHistoryRef = useRef<StoredPick[]>([]);

  useEffect(() => {
    allHistoryRef.current = allHistory;
  }, [allHistory]);

  const applyHistoryResponse = useCallback(
    async (data: HistoryResponse) => {
      const items = data?.history ?? [];
      const all = data?.all ?? allHistoryRef.current;
      const url = await runtime.getPageUrl();
      setPageUrl(url);
      setHistory(items);
      setAllHistory(all);
      setActiveSessionId(data?.sessionId ?? null);
      const grouped = groupPicksBySession(all, url);
      const groupedIds = grouped.map((group) => group.sessionId);
      const responseOrder = data?.sessionOrder ?? [];
      const mergedOrder = responseOrder
        .filter((id, idx) => responseOrder.indexOf(id) === idx)
        .concat(groupedIds.filter((id) => !responseOrder.includes(id)));
      const finalOrder = mergedOrder.length ? mergedOrder : groupedIds;
      setSessionOrder(finalOrder);
      const byId = new Map(grouped.map((group) => [group.sessionId, group]));
      setSessionGroups(
        finalOrder.map((id) => byId.get(id) ?? { sessionId: id, picks: [] }),
      );
      setActivePick((prev) => {
        if (prev && items.some((p) => p.id === prev.id)) return prev;
        return items[items.length - 1] ?? null;
      });
    },
    [runtime],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await runtime.sendMessage<HistoryResponse>({
        type: "GET_PICK_HISTORY",
      });
      await applyHistoryResponse(data);
    } catch {
      /* ignore */
    }
  }, [runtime, applyHistoryResponse]);

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
      if (area === "session" && changes.lastPick) {
        const pick = changes.lastPick.newValue as StoredPick | undefined;
        setActivePick(pick ?? null);
      }
      if (area === "local" && changes.pickHistory?.newValue) {
        void refresh();
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
  }, [runtime, refresh, pageUrl]);

  const newSession = useCallback(async () => {
    try {
      const data = await runtime.sendMessage<HistoryResponse>({
        type: "NEW_SESSION",
      });
      await applyHistoryResponse(data);
      setActivePick(null);
    } catch {
      /* ignore */
    }
  }, [applyHistoryResponse]);

  const switchSession = useCallback(
    async (sessionId: string) => {
      try {
        const data = await runtime.sendMessage<HistoryResponse>({
          type: "SET_ACTIVE_SESSION",
          payload: { sessionId },
        });
        if (data?.history) {
          await applyHistoryResponse(data);
        }
      } catch {
        /* ignore */
      }
    },
    [applyHistoryResponse],
  );

  const selectPick = useCallback(
    (pick: StoredPick) => {
      setActivePick(pick);
      void runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick });
    },
    [runtime],
  );

  const savePickComment = useCallback(
    async (pickId: string, comment: string) => {
      try {
        await runtime.sendMessage({
          type: "UPDATE_PICK_COMMENT",
          payload: { pickId, comment },
        });
        setActivePick((prev) =>
          prev?.id === pickId ? { ...prev, comment: comment.trim() || undefined } : prev,
        );
        setHistory((prev) =>
          prev.map((pick) =>
            pick.id === pickId
              ? { ...pick, comment: comment.trim() || undefined }
              : pick,
          ),
        );
      } catch {
        /* ignore */
      }
    },
    [runtime],
  );

  const deletePick = useCallback(
    async (pickId: string) => {
      try {
        const res = await runtime.sendMessage<{ ok?: boolean }>({
          type: "DELETE_PICK",
          payload: { pickId },
        });
        if (res?.ok === false) return;

        setHistory((prev) => {
          const next = prev.filter((pick) => pick.id !== pickId);
          setActivePick((current) => {
            if (current?.id !== pickId) return current;
            return next[next.length - 1] ?? null;
          });
          return next;
        });
        setAllHistory((prev) => {
          const next = prev.filter((pick) => pick.id !== pickId);
          const grouped = groupPicksBySession(next, pageUrl);
          const keepOrder = sessionOrder.filter((id) =>
            grouped.some((group) => group.sessionId === id),
          );
          const groupedIds = grouped.map((group) => group.sessionId);
          const finalOrder = keepOrder.concat(
            groupedIds.filter((id) => !keepOrder.includes(id)),
          );
          const byId = new Map(grouped.map((group) => [group.sessionId, group]));
          setSessionOrder(finalOrder);
          setSessionGroups(
            finalOrder.map((id) => byId.get(id) ?? { sessionId: id, picks: [] }),
          );
          return next;
        });
      } catch {
        /* ignore */
      }
    },
    [runtime, pageUrl, sessionOrder],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const data = await runtime.sendMessage<HistoryResponse>({
          type: "DELETE_SESSION",
          payload: { sessionId },
        });
        if (data?.sessionId != null || data?.history) {
          await applyHistoryResponse(data);
        } else {
          void refresh();
        }
      } catch {
        /* ignore */
      }
    },
    [runtime, applyHistoryResponse, refresh],
  );

  return {
    history,
    sessionGroups,
    sessionOrder,
    activeSessionId,
    activePick,
    setActivePick,
    refresh,
    newSession,
    switchSession,
    selectPick,
    savePickComment,
    deletePick,
    deleteSession,
  };
}
