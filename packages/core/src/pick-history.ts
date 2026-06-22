import type { PickerElementPayload } from "./types/messages.js";

export interface StoredPick extends PickerElementPayload {
  id: string;
  url: string;
  pageTitle: string;
  timestamp: number;
  label: string;
}

const MAX_HISTORY = 80;

export function pickLabel(pick: PickerElementPayload): string {
  const text = pick.innerText.trim().slice(0, 24);
  const id = pick.css.match(/#([a-zA-Z][\w-]*)/)?.[1];
  if (text) return `${pick.tagName} "${text}"`;
  if (id) return `${pick.tagName}#${id}`;
  if (pick.name) return `${pick.tagName} [${pick.name.slice(0, 20)}]`;
  return pick.tagName;
}

export function toStoredPick(
  pick: PickerElementPayload,
  url: string,
  pageTitle: string,
): StoredPick {
  return {
    ...pick,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    pageTitle,
    timestamp: Date.now(),
    label: pickLabel(pick),
  };
}

export function appendPickHistory(
  history: StoredPick[],
  entry: StoredPick,
): StoredPick[] {
  const withoutDup = history.filter(
    (h) => h.css !== entry.css || h.url !== entry.url,
  );
  return [entry, ...withoutDup].slice(0, MAX_HISTORY);
}

export function picksForUrl(history: StoredPick[], url: string): StoredPick[] {
  try {
    const u = new URL(url);
    return history.filter((h) => {
      try {
        return new URL(h.url).origin + new URL(h.url).pathname === u.origin + u.pathname;
      } catch {
        return h.url === url;
      }
    });
  } catch {
    return history.filter((h) => h.url === url);
  }
}
