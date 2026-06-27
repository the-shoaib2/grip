import { useCallback } from "preact/hooks";
import type { OpenContextEditorPayload, StoredPick } from "@grip/core";
import { useGripRuntime } from "../../runtime/context";

export interface PageContextEditorMeta {
  pickIndex: number;
  pickCount: number;
  sessionPicks?: StoredPick[];
}

export function usePageContextEditor() {
  const runtime = useGripRuntime();

  return useCallback(
    (pick: StoredPick, meta?: PageContextEditorMeta) => {
      const payload: OpenContextEditorPayload = {
        pick,
        pickIndex: meta?.pickIndex,
        pickCount: meta?.pickCount,
        sessionPicks: meta?.sessionPicks,
      };
      void (async () => {
        await runtime.sendMessage({ type: "HIDE_TRAY" });
        await runtime.sendMessage({ type: "OPEN_CONTEXT_EDITOR", payload });
      })();
    },
    [runtime],
  );
}
