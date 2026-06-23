import type { PickerElementPayload, StoredPick } from "./types/messages.js";

const MAX_HISTORY = 80;

export function newSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

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
  sessionId: string,
): StoredPick {
  return {
    ...pick,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionId,
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

export function clearPicksForUrl(history: StoredPick[], url: string): StoredPick[] {
  try {
    const u = new URL(url);
    const pageKey = u.origin + u.pathname;
    return history.filter((h) => {
      try {
        const hu = new URL(h.url);
        return hu.origin + hu.pathname !== pageKey;
      } catch {
        return h.url !== url;
      }
    });
  } catch {
    return history.filter((h) => h.url !== url);
  }
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

/** Picks saved in the current chat session on this page. */
export function picksForSession(
  history: StoredPick[],
  url: string,
  sessionId: string,
): StoredPick[] {
  return picksForUrl(history, url)
    .filter((h) => h.sessionId === sessionId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export interface SessionPickGroup {
  sessionId: string;
  picks: StoredPick[];
}

/** Group page picks by session, newest session first. */
export function groupPicksBySession(
  history: StoredPick[],
  url: string,
): SessionPickGroup[] {
  const pagePicks = picksForUrl(history, url);
  const bySession = new Map<string, StoredPick[]>();

  for (const pick of pagePicks) {
    const list = bySession.get(pick.sessionId) ?? [];
    list.push(pick);
    bySession.set(pick.sessionId, list);
  }

  return [...bySession.entries()]
    .map(([sessionId, picks]) => ({
      sessionId,
      picks: picks.sort((a, b) => a.timestamp - b.timestamp),
    }))
    .sort((a, b) => {
      const aLast = a.picks[a.picks.length - 1]?.timestamp ?? 0;
      const bLast = b.picks[b.picks.length - 1]?.timestamp ?? 0;
      return bLast - aLast;
    });
}

/** Remove picks for one session on a page; keep other sessions on the same page. */
export function clearPicksForSession(
  history: StoredPick[],
  url: string,
  sessionId: string,
): StoredPick[] {
  const sessionPicks = new Set(
    picksForSession(history, url, sessionId).map((p) => p.id),
  );
  if (sessionPicks.size === 0) return history;
  return history.filter((h) => !sessionPicks.has(h.id));
}

/** Patch a stored pick by id (e.g. comment edits). */
export function updatePickInHistory(
  history: StoredPick[],
  pickId: string,
  patch: Partial<Pick<StoredPick, "comment">>,
): StoredPick[] {
  let changed = false;
  const next = history.map((h) => {
    if (h.id !== pickId) return h;
    changed = true;
    return { ...h, ...patch };
  });
  return changed ? next : history;
}

/** Most recent pick in a session on a page (by timestamp order). */
export function lastPickInSession(
  history: StoredPick[],
  url: string,
  sessionId: string,
): StoredPick | undefined {
  const sessionPicks = picksForSession(history, url, sessionId);
  return sessionPicks[sessionPicks.length - 1];
}

/** Remove a single stored pick by id. */
export function removePickFromHistory(
  history: StoredPick[],
  pickId: string,
): StoredPick[] {
  if (!history.some((h) => h.id === pickId)) return history;
  return history.filter((h) => h.id !== pickId);
}
