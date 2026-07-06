import type { PatchAppliedPayload } from "grip-dev";

const STORAGE_KEY = "gripPatchHistory";
const MAX_ENTRIES = 50;

export async function recordPatchApplied(
  payload: PatchAppliedPayload & { id?: string; context?: string },
): Promise<void> {
  const entry = {
    id: payload.id ?? `patch-${Date.now()}`,
    filePath: payload.filePath,
    startLine: payload.startLine,
    endLine: payload.endLine,
    summary: payload.summary ?? "",
    appliedAt: Date.now(),
    context: payload.context,
  };

  const data = await chrome.storage.local.get(STORAGE_KEY);
  const existing = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
}

export async function getPatchHistory(): Promise<unknown[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}
