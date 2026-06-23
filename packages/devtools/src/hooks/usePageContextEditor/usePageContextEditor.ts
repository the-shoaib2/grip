import { useCallback } from "preact/hooks";
import type { OpenContextEditorPayload, StoredPick } from "@grip/core";
import { useGripRuntime } from "../../runtime/context";

export interface PageContextEditorMeta {
  pickIndex: number;
  pickCount: number;
}

export function usePageContextEditor() {
  const runtime = useGripRuntime();

  return useCallback(
    (pick: StoredPick, meta?: PageContextEditorMeta) => {
      const payload: OpenContextEditorPayload = {
        pick,
        pickIndex: meta?.pickIndex,
        pickCount: meta?.pickCount,
      };
      void runtime.sendMessage({ type: "OPEN_CONTEXT_EDITOR", payload });
    },
    [runtime],
  );
}
