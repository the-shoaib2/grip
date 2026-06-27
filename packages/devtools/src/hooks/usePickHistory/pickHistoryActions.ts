import {
  groupPicksBySession,
  reconcileSessionOrderAfterPickDelete,
  type StoredPick,
} from "@grip/core";
import type { Dispatch, StateUpdater } from "preact/hooks";
import type { GripRuntime } from "@devtools/runtime/types";
import type { HistoryResponse } from "@devtools/hooks/usePickHistory/types";

export interface PickHistoryActionDeps {
  runtime: GripRuntime;
  applyHistoryResponse: (data: HistoryResponse) => Promise<void>;
  refresh: () => Promise<void>;
  setActivePick: Dispatch<StateUpdater<StoredPick | null>>;
  setHistory: Dispatch<StateUpdater<StoredPick[]>>;
  setAllHistory: Dispatch<StateUpdater<StoredPick[]>>;
  setSessionOrder: Dispatch<StateUpdater<string[]>>;
  setSessionGroups: Dispatch<
    StateUpdater<import("@grip/core").SessionPickGroup[]>
  >;
  pageUrl: string;
  sessionOrder: string[];
}

export function createPickHistoryActions(deps: PickHistoryActionDeps) {
  const {
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
  } = deps;

  async function newSession() {
    try {
      const data = await runtime.sendMessage<HistoryResponse>({
        type: "NEW_SESSION",
      });
      await applyHistoryResponse(data);
      setActivePick(null);
    } catch {
      /* ignore */
    }
  }

  async function switchSession(sessionId: string) {
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
  }

  function selectPick(pick: StoredPick) {
    setActivePick(pick);
    void runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick });
  }

  async function savePickComment(pickId: string, comment: string) {
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
  }

  async function deletePick(pickId: string) {
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
        const groupedIds = grouped.map((group) => group.sessionId);
        const finalOrder = reconcileSessionOrderAfterPickDelete(
          sessionOrder,
          groupedIds,
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
  }

  async function deleteSession(sessionId: string) {
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
  }

  return {
    newSession,
    switchSession,
    selectPick,
    savePickComment,
    deletePick,
    deleteSession,
  };
}
