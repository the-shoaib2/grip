export class RefMap {
    entries = new Map();
    counter = 0;
    valid = true;
    clear() {
        this.entries.clear();
        this.counter = 0;
        this.valid = true;
    }
    invalidate() {
        this.valid = false;
        this.entries.clear();
    }
    isValid() {
        return this.valid;
    }
    assign(backendNodeId, meta = {}) {
        this.counter += 1;
        const ref = `e${this.counter}`;
        const entry = { ref, backendNodeId, ...meta };
        this.entries.set(ref, entry);
        return ref;
    }
    get(ref) {
        if (!this.valid)
            return undefined;
        return this.entries.get(ref);
    }
    getAll() {
        const out = {};
        for (const [k, v] of this.entries)
            out[k] = v;
        return out;
    }
    require(ref) {
        const entry = this.get(ref);
        if (!entry) {
            throw new Error(`Ref "${ref}" is invalid or expired. Call snapshot() to get fresh refs.`);
        }
        return entry;
    }
}
export function createRefMap() {
    return new RefMap();
}
//# sourceMappingURL=ref-map.js.map