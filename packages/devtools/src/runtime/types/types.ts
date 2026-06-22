import type { GripMessageType } from "@grip/core";

export type RuntimeMessage = {
  type: GripMessageType | string;
  payload?: unknown;
};

export type StorageChangeHandler = (
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) => void;

export interface GripRuntime {
  sendMessage<T = unknown>(msg: RuntimeMessage): Promise<T>;
  onStorageChanged(handler: StorageChangeHandler): () => void;
  getPageUrl(): Promise<string>;
  checkMcp(): Promise<{ ok: boolean }>;
  sessionGet(keys: string | string[]): Promise<Record<string, unknown>>;
  sessionSet(items: Record<string, unknown>): Promise<void>;
  getIconUrl(path?: string): string;
  closeWindow?(): void;
}
