import type { StoredPick } from "./types/messages.js";

export interface SessionContextRecord {
  sessionId: string;
  picks: StoredPick[];
  registeredAt: number;
}

const inMemorySessions = new Map<string, SessionContextRecord>();

/** In-process session registry for MCP handshake (host-side). */
export function registerSessionContext(
  sessionId: string,
  picks: StoredPick[],
): SessionContextRecord {
  const record: SessionContextRecord = {
    sessionId,
    picks,
    registeredAt: Date.now(),
  };
  inMemorySessions.set(sessionId, record);
  return record;
}

export function getSessionContext(sessionId: string): SessionContextRecord | undefined {
  return inMemorySessions.get(sessionId);
}

export function clearSessionContext(sessionId: string): boolean {
  return inMemorySessions.delete(sessionId);
}

export function listSessionContexts(): SessionContextRecord[] {
  return [...inMemorySessions.values()];
}

/** Persist session to `.grip/sessions/<id>.json` when workspace root is set. */
export async function persistSessionContext(
  sessionId: string,
  picks: StoredPick[],
  workspaceRoot: string,
): Promise<string> {
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(workspaceRoot, ".grip", "sessions");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${sessionId}.json`);
  const record = registerSessionContext(sessionId, picks);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), "utf-8");
  return filePath;
}

/** Load session from disk into in-memory registry. */
export async function loadSessionContextFromDisk(
  sessionId: string,
  workspaceRoot: string,
): Promise<SessionContextRecord | undefined> {
  const fs = await import("fs");
  const path = await import("path");
  const filePath = path.join(workspaceRoot, ".grip", "sessions", `${sessionId}.json`);
  if (!fs.existsSync(filePath)) return undefined;
  const record = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SessionContextRecord;
  inMemorySessions.set(sessionId, record);
  return record;
}
