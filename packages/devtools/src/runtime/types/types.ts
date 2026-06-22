import type { GripMessageType } from "@grip/core";

export type RuntimeMessage = {
  type: GripMessageType | string;
  payload?: unknown;
  tabId?: number;
};

export type StorageChangeHandler = (
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) => void;

export interface GripRuntime {
  sendMessage<T = unknown>(msg: RuntimeMessage): Promise<T>;
  onStorageChanged(handler: StorageChangeHandler): () => void;
  getPageUrl(): Promise<string>;
  getTargetTabId?(): number | undefined;
  checkMcp(): Promise<{ ok: boolean }>;
  openMcpDocs(): void;
  sessionGet(keys: string | string[]): Promise<Record<string, unknown>>;
  sessionSet(items: Record<string, unknown>): Promise<void>;
  getIconUrl(path?: string): string;
  closeWindow?(): void;
}
