/** Heuristic line-range expansion around a component line. */
export function expandLineRange(
  lines: string[],
  startLine: number,
  options?: { padding?: number; maxLines?: number },
): { start: number; end: number } {
  const padding = options?.padding ?? 2;
  const maxLines = options?.maxLines ?? 80;
  const lineIdx = Math.max(0, Math.min(lines.length - 1, startLine - 1));

  let start = lineIdx;
  let end = lineIdx;

  const isBoundary = (line: string) =>
    /^(export\s+)?(default\s+)?(function|class|const|let|var)\s/.test(line.trim()) ||
    /^export\s+default\s/.test(line.trim());

  while (start > 0 && !isBoundary(lines[start] ?? "")) {
    start--;
    if (lineIdx - start > 40) break;
  }

  while (end < lines.length - 1) {
    const next = lines[end + 1] ?? "";
    if (isBoundary(next) && end > lineIdx) break;
    end++;
    if (end - lineIdx > 40) break;
  }

  start = Math.max(0, start - padding);
  end = Math.min(lines.length - 1, end + padding);

  if (end - start + 1 > maxLines) {
    const half = Math.floor(maxLines / 2);
    start = Math.max(0, lineIdx - half);
    end = Math.min(lines.length - 1, start + maxLines - 1);
  }

  return { start: start + 1, end: end + 1 };
}
