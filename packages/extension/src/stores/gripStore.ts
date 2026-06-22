import { create } from "zustand";
import type { LogMessagePayload, PickerElementPayload } from "@grip/core";

interface GripState {
  lastPick: PickerElementPayload | null;
  logs: LogMessagePayload[];
  setLastPick: (pick: PickerElementPayload) => void;
  setPickComment: (comment: string) => void;
  addLog: (entry: LogMessagePayload) => void;
  clearLogs: () => void;
}

export const useGripStore = create<GripState>((set) => ({
  lastPick: null,
  logs: [],
  setLastPick: (pick) => set({ lastPick: pick }),
  setPickComment: (comment) =>
    set((s) =>
      s.lastPick ? { lastPick: { ...s.lastPick, comment } } : s,
    ),
  addLog: (entry) =>
    set((s) => ({ logs: [...s.logs.slice(-499), entry] })),
  clearLogs: () => set({ logs: [] }),
}));
