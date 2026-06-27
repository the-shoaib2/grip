import { expandLineRange } from "./expand-range.js";
import { normalizeSourcePath, resolveSourcePath } from "./normalize-path.js";

export interface ReadSourceSnippetOptions {
  filePath: string;
  line?: number;
  workspaceRoot?: string;
  padding?: number;
  maxLines?: number;
}

export interface SourceSnippetResult {
  filePath: string;
  lineRange: { start: number; end: number };
  sourceCode: string;
}

/** Read a source snippet from disk (Node/host only). */
export async function readSourceSnippet(
  options: ReadSourceSnippetOptions,
): Promise<SourceSnippetResult> {
  const fs = await import("fs");
  const relative = normalizeSourcePath(options.filePath, options.workspaceRoot);
  const absolute = resolveSourcePath(relative, options.workspaceRoot);

  if (!fs.existsSync(absolute)) {
    throw new Error(`File not found: ${absolute}`);
  }

  const content = fs.readFileSync(absolute, "utf-8");
  const lines = content.split(/\r?\n/);
  const anchor = options.line ?? 1;
  const range = expandLineRange(lines, anchor, {
    padding: options.padding,
    maxLines: options.maxLines,
  });

  const snippet = lines.slice(range.start - 1, range.end).join("\n");

  return {
    filePath: relative,
    lineRange: range,
    sourceCode: snippet,
  };
}
