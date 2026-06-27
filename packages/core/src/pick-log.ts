import { normalizeSourcePath } from "./source-mapper/normalize-path.js";
import type { PickerElementPayload } from "./types/messages.js";

export interface PickLogSnippet {
  filePath: string;
  lineRange: { start: number; end: number };
  sourceCode: string;
}

export interface PickLogOptions {
  workspaceRoot?: string;
  sourceCode?: string;
  lineRange?: { start: number; end: number };
}

/** Human-readable lines for a picked element (console, terminal, debug output). */
export function formatPickLogLines(
  pick: PickerElementPayload,
  options?: PickLogOptions,
): string[] {
  const lines: string[] = [];
  const fw = pick.frameworkContext;
  const tag = pick.tagName.toLowerCase();

  lines.push(`Element: <${tag}>`);
  if (pick.innerText) lines.push(`Text: "${pick.innerText}"`);
  lines.push(`Role: ${pick.role}`);
  if (pick.name) lines.push(`A11y name: "${pick.name}"`);

  if (fw) {
    lines.push(`Framework: ${fw.framework}`);
    if (fw.componentName) lines.push(`Component: ${fw.componentName}`);
    if (fw.file) {
      const file = normalizeSourcePath(fw.file, options?.workspaceRoot);
      lines.push(fw.line ? `Source: ${file}:${fw.line}` : `Source: ${file}`);
    }
  }

  lines.push(`CSS: ${pick.css}`);
  lines.push(`XPath: ${pick.xpath}`);
  if (pick.shadowDOM) lines.push("Shadow DOM: yes");
  if (pick.iframe !== "none") lines.push(`iframe: ${pick.iframe}`);
  if (pick.comment?.trim()) lines.push(`Comment: ${pick.comment.trim()}`);

  if (options?.sourceCode) {
    const file = fw?.file
      ? normalizeSourcePath(fw.file, options.workspaceRoot)
      : "source";
    const range = options.lineRange;
    lines.push("");
    lines.push(
      range ? `// ${file}:${range.start}-${range.end}` : `// ${file}`,
    );
    lines.push(options.sourceCode);
  }

  return lines;
}

const GRIP_LOG_STYLE = "color:#2563eb;font-weight:bold";

export function pickLogLabel(pick: PickerElementPayload): string {
  const tag = pick.tagName.toLowerCase();
  const component = pick.frameworkContext?.componentName;
  return component ? `Grip · <${tag}> · ${component}` : `Grip · <${tag}>`;
}

/** Log pick metadata to the browser console. */
export function logPickedElement(
  pick: PickerElementPayload,
  options?: PickLogOptions,
): void {
  const lines = formatPickLogLines(pick, options);
  console.groupCollapsed(`%c${pickLogLabel(pick)}`, GRIP_LOG_STYLE);
  for (const line of lines) console.log(line);
  console.groupEnd();
}

/** Fetch a source snippet from a Grip dev server (`/__grip/source`). */
export async function fetchPickSourceSnippet(
  pick: PickerElementPayload,
  options?: { baseUrl?: string; workspaceRoot?: string },
): Promise<PickLogSnippet | null> {
  const file = pick.frameworkContext?.file;
  if (!file) return null;

  const params = new URLSearchParams({
    file: normalizeSourcePath(file, options?.workspaceRoot),
    line: String(pick.frameworkContext?.line ?? 1),
  });
  const base = options?.baseUrl ?? "";
  const res = await fetch(`${base}/__grip/source?${params}`);
  if (!res.ok) return null;
  return (await res.json()) as PickLogSnippet;
}

/** Log pick metadata and attach source code when a dev server is available. */
export async function logPickedElementWithSource(
  pick: PickerElementPayload,
  options?: { baseUrl?: string; workspaceRoot?: string },
): Promise<void> {
  let snippet: PickLogSnippet | null = null;
  try {
    snippet = await fetchPickSourceSnippet(pick, options);
  } catch {
    // Dev server or source file unavailable — metadata-only log is enough.
  }

  logPickedElement(pick, {
    workspaceRoot: options?.workspaceRoot,
    sourceCode: snippet?.sourceCode,
    lineRange: snippet?.lineRange,
  });
}
