/** Format picked element for Grip MCP / Cursor agent consumption. */
export function formatMcpPrompt(pick) {
    const lines = [];
    if (pick.comment?.trim()) {
        lines.push(`Context: ${pick.comment.trim()}`, "");
    }
    lines.push(`Element: ${pick.tagName} · role: ${pick.role}`, `Text: "${pick.innerText}"`, `CSS selector: ${pick.css}`, `XPath: ${pick.xpath}`, `Rect: { top: ${pick.rect.top}, left: ${pick.rect.left}, width: ${pick.rect.width}, height: ${pick.rect.height} }`, `A11y name: "${pick.name}"`, `Shadow DOM: ${pick.shadowDOM ? "yes" : "no"}`, `iframe: ${pick.iframe}`, "", "---", "Grip MCP workflow:", "1. snapshot() — get accessibility tree + refs on this page", "2. highlight(ref) before click(ref) or fill(ref, value)", "3. read_logs() after each action", "", "If refs expired after navigation, call snapshot() again.", `CSS/XPath above are fallbacks when MCP refs are unavailable.`);
    return lines.join("\n");
}
/** Join MCP prompts for every saved pick on the page. */
export function formatAllMcpPrompts(picks) {
    if (!picks.length)
        return "";
    return picks
        .map((pick, i) => {
        const name = pick.label ?? pick.tagName;
        return `### ${i + 1}. ${name}\n\n${formatMcpPrompt(pick)}`;
    })
        .join("\n\n---\n\n");
}
export const GRIP_MCP_DEFAULT_PORT = 9222;
export async function checkChromeDebugPort(port = GRIP_MCP_DEFAULT_PORT) {
    try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!res.ok)
            return { ok: false };
        const data = (await res.json());
        return { ok: true, browser: data.Browser };
    }
    catch {
        return { ok: false };
    }
}
//# sourceMappingURL=mcp-prompt.js.map