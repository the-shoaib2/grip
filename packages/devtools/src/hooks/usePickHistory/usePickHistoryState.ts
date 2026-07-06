import { groupPicksBySession, mergeSessionOrder, type StoredPick } from "grip-dev";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { GripRuntime } from "@devtools/runtime/types";
import { createPickHistoryActions } from "@devtools/hooks/usePickHistory/pickHistoryActions";
import type { HistoryResponse, UsePickHistoryResult } from "@devtools/hooks/usePickHistory/types";

export function usePickHistoryState(runtime: GripRuntime): UsePickHistoryResult {
  const [history, setHistory] = useState<StoredPick[]>([]);
  const [allHistory, setAllHistory] = useState<StoredPick[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionGroups, setSessionGroups] = useState<
    import("grip-dev").SessionPickGroup[]
  >([]);
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
      const finalOrder = mergeSessionOrder(data?.sessionOrder ?? [], groupedIds);
      setSessionOrder(finalOrder);
      const byId = new Map(grouped.map((group) => [group.sessionId, group]));
      setSessionGroups(
        finalOrder.map((id) => byId.get(id) ?? { sessionId: id, picks: [] }),
      );
      setActivePick((prev) => {
        if (!items.length) return prev ?? null;
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

  const { newSession, switchSession, selectPick, savePickComment, deletePick, deleteSession } =
    useMemo(
      () =>
        createPickHistoryActions({
          runtime,
          applyHistoryResponse,
          refresh,
          setActivePick,
          setHistory,
          setAllHistory,
          setSessionOrder,
          setSessionGroups,
          pageUrl,
          sessionOrder,
        }),
      [runtime, applyHistoryResponse, refresh, pageUrl, sessionOrder],
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
