import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { UsePickHistoryResult } from "@/hooks/usePickHistory/types";

export type { UsePickHistoryResult } from "@/hooks/usePickHistory/types";

export const PickHistoryContext = createContext<UsePickHistoryResult | null>(null);

export function usePickHistory(): UsePickHistoryResult {
  const value = useContext(PickHistoryContext);
  if (!value) {
    throw new Error("usePickHistory must be used within GripRuntimeProvider");
  }
  return value;
}
