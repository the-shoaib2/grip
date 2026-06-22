import type { PickerElementPayload, StoredPick } from "./types/messages.js";
export declare function pickLabel(pick: PickerElementPayload): string;
export declare function toStoredPick(pick: PickerElementPayload, url: string, pageTitle: string): StoredPick;
export declare function appendPickHistory(history: StoredPick[], entry: StoredPick): StoredPick[];
export declare function picksForUrl(history: StoredPick[], url: string): StoredPick[];
//# sourceMappingURL=pick-history.d.ts.map