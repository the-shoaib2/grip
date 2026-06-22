import { create } from "zustand";
import type { LogMessagePayload, PickerElementPayload } from "@grip/core";

interface GripState {
  lastPick: PickerElementPayload | null;
  logs: LogMessagePayload[];
  setLastPick: (pick: PickerElementPayload) => void;
  addLog: (entry: LogMessagePayload) => void;
  clearLogs: () => void;
}

export const useGripStore = create<GripState>((set) => ({
  lastPick: null,
  logs: [],
  setLastPick: (pick) => set({ lastPick: pick }),
  addLog: (entry) =>
    set((s) => ({ logs: [...s.logs.slice(-499), entry] })),
  clearLogs: () => set({ logs: [] }),
}));
