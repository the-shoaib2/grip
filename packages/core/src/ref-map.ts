import type { RefEntry } from "../types.js";

export class RefMap {
  private entries = new Map<string, RefEntry>();
  private counter = 0;
  private valid = true;

  clear(): void {
    this.entries.clear();
    this.counter = 0;
    this.valid = true;
  }

  invalidate(): void {
    this.valid = false;
    this.entries.clear();
  }

  isValid(): boolean {
    return this.valid;
  }

  assign(backendNodeId: number, meta: Partial<RefEntry> = {}): string {
    this.counter += 1;
    const ref = `e${this.counter}`;
    const entry: RefEntry = { ref, backendNodeId, ...meta };
    this.entries.set(ref, entry);
    return ref;
  }

  get(ref: string): RefEntry | undefined {
    if (!this.valid) return undefined;
    return this.entries.get(ref);
  }

  getAll(): Record<string, RefEntry> {
    const out: Record<string, RefEntry> = {};
    for (const [k, v] of this.entries) out[k] = v;
    return out;
  }

  require(ref: string): RefEntry {
    const entry = this.get(ref);
    if (!entry) {
      throw new Error(
        `Ref "${ref}" is invalid or expired. Call snapshot() to get fresh refs.`,
      );
    }
    return entry;
  }
}

export function createRefMap(): RefMap {
  return new RefMap();
}
