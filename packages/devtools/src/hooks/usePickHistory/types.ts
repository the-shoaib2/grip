import type { SessionPickGroup, StoredPick } from "@grip/core";

export interface HistoryResponse {
  history?: StoredPick[];
  all?: StoredPick[];
  sessionOrder?: string[];
  sessionId?: string;
  tabId?: number;
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
