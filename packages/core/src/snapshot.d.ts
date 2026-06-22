import type { RefMap } from "./ref-map.js";
import type { A11ySnapshot, CdpSession } from "./types.js";
export declare function buildSnapshot(cdp: CdpSession, refMap: RefMap, frameId?: string): Promise<A11ySnapshot>;
export declare function buildSnapshotForLLM(cdp: CdpSession, refMap: RefMap, meta?: {
    title?: string;
    url?: string;
    frameId?: string;
}): Promise<string>;
//# sourceMappingURL=snapshot.d.ts.map