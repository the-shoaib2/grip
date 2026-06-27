import type { PatchOptions } from "./patch-engine.js";

export interface ContextEnginePatchBody {
  startLine: number;
  endLine: number;
  replacementCode: string;
}

export interface ContextEnginePatch {
  status: "SUCCESS" | "FAILED";
  context: string;
  file: string;
  changes: string[];
  patch: ContextEnginePatchBody;
  summary: string;
}

const BLOCKED_PATH_RE =
  /(^|\/)(\.env|\.env\.[^/]+|credentials\.json|node_modules\/|\.git\/|\.github\/workflows\/)/i;

/** Reject patches targeting sensitive or out-of-scope paths. */
export function isBlockedPatchPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return BLOCKED_PATH_RE.test(normalized);
}

export function contextEnginePatchToPatchOptions(
  patch: ContextEnginePatch,
  workspaceRoot?: string,
): PatchOptions {
  let filePath = patch.file.replace(/\\/g, "/");
  if (workspaceRoot && !filePath.startsWith("/")) {
    const root = workspaceRoot.replace(/\\/g, "/").replace(/\/$/, "");
    filePath = `${root}/${filePath}`;
  }
  return {
    filePath,
    startLine: patch.patch.startLine,
    endLine: patch.patch.endLine,
    replacementCode: patch.patch.replacementCode,
  };
}

export interface ValidatePatchOptions {
  workspaceRoot?: string;
  allowedFile?: string;
  allowedStartLine?: number;
  allowedEndLine?: number;
}

export interface PatchValidationResult {
  valid: boolean;
  errors: string[];
  patchOptions?: PatchOptions;
}

/** Validate a Context Engine patch before apply. */
export async function validateContextEnginePatch(
  patch: ContextEnginePatch,
  options?: ValidatePatchOptions,
): Promise<PatchValidationResult> {
  const errors: string[] = [];

  if (patch.status !== "SUCCESS") {
    errors.push(`Patch status is ${patch.status}`);
  }

  if (!patch.file?.trim()) errors.push("Missing file path");
  if (patch.patch.replacementCode === undefined) {
    errors.push("Missing replacement code");
  }
  if (patch.patch.startLine < 1) errors.push("startLine must be >= 1");
  if (patch.patch.endLine < patch.patch.startLine) {
    errors.push("endLine must be >= startLine");
  }

  if (isBlockedPatchPath(patch.file)) {
    errors.push(`Blocked file path: ${patch.file}`);
  }

  if (options?.allowedFile) {
    const norm = (p: string) => p.replace(/\\/g, "/");
    if (norm(patch.file) !== norm(options.allowedFile)) {
      errors.push(`File ${patch.file} does not match allowed context file ${options.allowedFile}`);
    }
  }

  if (
    options?.allowedStartLine !== undefined &&
    options?.allowedEndLine !== undefined
  ) {
    if (
      patch.patch.startLine < options.allowedStartLine ||
      patch.patch.endLine > options.allowedEndLine
    ) {
      errors.push(
        `Patch range ${patch.patch.startLine}-${patch.patch.endLine} exceeds allowed context range ${options.allowedStartLine}-${options.allowedEndLine}`,
      );
    }
  }

  const patchOptions = contextEnginePatchToPatchOptions(patch, options?.workspaceRoot);

  try {
    const fs = await import("fs");
    if (!fs.existsSync(patchOptions.filePath)) {
      errors.push(`File not found: ${patchOptions.filePath}`);
    } else {
      const lines = fs.readFileSync(patchOptions.filePath, "utf-8").split(/\r?\n/);
      if (patchOptions.endLine > lines.length) {
        errors.push(
          `endLine ${patchOptions.endLine} exceeds file length (${lines.length} lines)`,
        );
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Filesystem validation failed");
  }

  return {
    valid: errors.length === 0,
    errors,
    patchOptions: errors.length === 0 ? patchOptions : undefined,
  };
}

/** Parse agent output into one or more ContextEnginePatch objects. */
export function parseContextEnginePatches(text: string): ContextEnginePatch[] {
  const patches: ContextEnginePatch[] = [];
  const blocks = text.split(/\n(?=Status:\s*(?:SUCCESS|FAILED))/i).filter(Boolean);

  for (const block of blocks) {
    const statusMatch = block.match(/^Status:\s*(SUCCESS|FAILED)/im);
    const contextMatch = block.match(/^Context:\s*(.+)$/im);
    const fileMatch = block.match(/^File:\s*(.+)$/im);
    const summaryMatch = block.match(/^Summary:\s*(.+)$/im);

    const changes: string[] = [];
    const changesSection = block.match(/^Changes:\s*([\s\S]*?)(?=^Patch:|^Summary:|$)/im);
    if (changesSection?.[1]) {
      for (const line of changesSection[1].split("\n")) {
        const trimmed = line.replace(/^\s*[-*]\s*/, "").trim();
        if (trimmed) changes.push(trimmed);
      }
    }

    const patchSection = block.match(
      /Patch:\s*\{?\s*startLine:\s*(\d+)\s*,?\s*endLine:\s*(\d+)\s*,?\s*replacementCode:\s*([\s\S]*?)\}?\s*(?:\n\n|$)/i,
    );

    if (!statusMatch || !fileMatch || !patchSection) continue;

    let replacementCode = patchSection[3] ?? "";
    replacementCode = replacementCode
      .replace(/^```[\w]*\n?/, "")
      .replace(/\n?```$/, "")
      .trimEnd();

    patches.push({
      status: statusMatch[1] as "SUCCESS" | "FAILED",
      context: contextMatch?.[1]?.trim() ?? "",
      file: fileMatch[1]!.trim(),
      changes,
      patch: {
        startLine: Number(patchSection[1]),
        endLine: Number(patchSection[2]),
        replacementCode,
      },
      summary: summaryMatch?.[1]?.trim() ?? "",
    });
  }

  return patches;
}
