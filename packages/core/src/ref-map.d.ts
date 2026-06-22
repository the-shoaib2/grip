import type { RefEntry } from "./types.js";
export declare class RefMap {
    private entries;
    private counter;
    private valid;
    clear(): void;
    invalidate(): void;
    isValid(): boolean;
    assign(backendNodeId: number, meta?: Partial<RefEntry>): string;
    get(ref: string): RefEntry | undefined;
    getAll(): Record<string, RefEntry>;
    require(ref: string): RefEntry;
}
export declare function createRefMap(): RefMap;
//# sourceMappingURL=ref-map.d.ts.map