import type { PickerElementPayload } from "./types/messages.js";
export interface PickerElementDetails extends PickerElementPayload {
    tagName: string;
}
/** Format picked element for Grip MCP / Cursor agent consumption. */
export declare function formatMcpPrompt(pick: PickerElementDetails): string;
/** Join MCP prompts for every saved pick on the page. */
export declare function formatAllMcpPrompts(picks: (PickerElementDetails & {
    label?: string;
})[]): string;
export declare const GRIP_MCP_DEFAULT_PORT = 9222;
export declare function checkChromeDebugPort(port?: number): Promise<{
    ok: boolean;
    browser?: string;
}>;
//# sourceMappingURL=mcp-prompt.d.ts.map