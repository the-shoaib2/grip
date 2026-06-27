import { formatInlineCommentForMcp } from "./inline-composer.js";
import type { PickerElementPayload } from "./types/messages.js";

export interface PickerElementDetails extends PickerElementPayload {
  tagName: string;
}

/** Format picked element for Grip MCP / Cursor agent consumption. */
export function formatMcpPrompt(pick: PickerElementDetails): string {
  const lines: string[] = [];

  if (pick.comment?.trim()) {
    const raw = pick.comment.trim();
    const hasChips = /\[\[grip:[a-zA-Z0-9_-]+\]\]/.test(raw);
    const context = hasChips
      ? formatInlineCommentForMcp(raw, {
          [`static-0`]: pick.tagName.toLowerCase(),
        })
      : raw;
    lines.push(`Context: ${context}`, "");
  }

  const fw = pick.frameworkContext;
  if (fw) {
    lines.push(`Framework: ${fw.framework}`);
    if (fw.componentName) lines.push(`Component: ${fw.componentName}`);
    if (fw.file) {
      const loc = fw.line ? `${fw.file}:${fw.line}` : fw.file;
      lines.push(`Source: ${loc}`);
    }
    lines.push("");
  }

  lines.push(
    `Element: ${pick.tagName} · role: ${pick.role}`,
    `Text: "${pick.innerText}"`,
    `CSS selector: ${pick.css}`,
    `XPath: ${pick.xpath}`,
    `Rect: { top: ${pick.rect.top}, left: ${pick.rect.left}, width: ${pick.rect.width}, height: ${pick.rect.height} }`,
    `A11y name: "${pick.name}"`,
    `Shadow DOM: ${pick.shadowDOM ? "yes" : "no"}`,
    `iframe: ${pick.iframe}`,
    "",
    "---",
    "Grip MCP workflow:",
    "1. snapshot() — get accessibility tree + refs on this page",
    "2. highlight(ref) before click(ref) or fill(ref, value)",
    "3. read_logs() after each action",
    "",
    "If refs expired after navigation, call snapshot() again.",
    `CSS/XPath above are fallbacks when MCP refs are unavailable.`,
  );
  return lines.join("\n");
}

/** Join MCP prompts for every pick in a chat session (oldest first). */
export function formatAllMcpPrompts(
  picks: (PickerElementDetails & { label?: string })[],
  options?: { sessionId?: string },
): string {
  if (!picks.length) return "";
  const countLabel =
    picks.length === 1 ? "1 element" : `${picks.length} elements`;
  const sessionRef = options?.sessionId?.trim();
  const header = sessionRef
    ? `## Grip session \`${sessionRef}\` · ${countLabel}`
    : picks.length === 1
      ? "## Grip session · 1 element"
      : `## Grip session · ${countLabel}`;
  const body = picks
    .map((pick, i) => {
      const name = pick.label ?? pick.tagName;
      return `### ${i + 1}. ${name}\n\n${formatMcpPrompt(pick)}`;
    })
    .join("\n\n---\n\n");
  return `${header}\n\n${body}`;
}

export const GRIP_MCP_DEFAULT_PORT = 9222;

export async function checkChromeDebugPort(
  port = GRIP_MCP_DEFAULT_PORT,
): Promise<{ ok: boolean; browser?: string }> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { Browser?: string };
    return { ok: true, browser: data.Browser };
  } catch {
    return { ok: false };
  }
}
