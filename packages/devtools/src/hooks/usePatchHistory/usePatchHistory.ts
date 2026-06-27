import { useEffect, useState } from "preact/hooks";

export interface PatchHistoryEntry {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  summary: string;
  appliedAt: number;
  context?: string;
}

const STORAGE_KEY = "gripPatchHistory";

export function usePatchHistory() {
  const [entries, setEntries] = useState<PatchHistoryEntry[]>([]);

  useEffect(() => {
    const chromeApi = (globalThis as { chrome?: typeof chrome }).chrome;
    if (!chromeApi?.storage?.local) return;

    void chromeApi.storage.local.get(STORAGE_KEY).then((data) => {
      const list = data[STORAGE_KEY];
      if (Array.isArray(list)) setEntries(list as PatchHistoryEntry[]);
    });

    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "local" || !changes[STORAGE_KEY]) return;
      const next = changes[STORAGE_KEY].newValue;
      if (Array.isArray(next)) setEntries(next as PatchHistoryEntry[]);
    };

    chromeApi.storage.onChanged.addListener(onChange);
    return () => chromeApi.storage.onChanged.removeListener(onChange);
  }, []);

  return entries;
}
