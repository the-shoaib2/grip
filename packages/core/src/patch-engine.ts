export interface PatchOptions {
  filePath: string;
  startLine: number; // 1-indexed
  endLine: number;   // 1-indexed
  replacementCode: string;
}

export async function applyPatch(options: PatchOptions): Promise<void> {
  const { filePath, startLine, endLine, replacementCode } = options;

  // Dynamic import of fs to prevent bundlers (like Vite) from complaining or bundling it for browser environments.
  const fs = await import("fs");

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  if (startLine < 1 || startLine > lines.length || endLine < startLine || endLine > lines.length) {
    throw new Error(`Invalid line range: ${startLine}-${endLine}. File has ${lines.length} lines.`);
  }

  // lines array is 0-indexed, startLine/endLine are 1-indexed.
  const before = lines.slice(0, startLine - 1);
  const after = lines.slice(endLine);
  const replacementLines = replacementCode.split(/\r?\n/);

  const newContent = [...before, ...replacementLines, ...after].join("\n");
  fs.writeFileSync(filePath, newContent, "utf-8");
}
