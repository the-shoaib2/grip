import type { PatchOptions } from "./patch-engine.js";
import type { ContextEnginePatch } from "./patch-validator.js";

export interface AppliedPatchRecord {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  summary: string;
  appliedAt: number;
  context?: string;
}

const appliedPatches: AppliedPatchRecord[] = [];

export function recordAppliedPatch(
  patch: ContextEnginePatch,
  options: PatchOptions,
): AppliedPatchRecord {
  const record: AppliedPatchRecord = {
    id: `patch-${Date.now()}-${appliedPatches.length}`,
    filePath: options.filePath,
    startLine: options.startLine,
    endLine: options.endLine,
    summary: patch.summary,
    appliedAt: Date.now(),
    context: patch.context,
  };
  appliedPatches.unshift(record);
  return record;
}

export function getAppliedPatchHistory(): AppliedPatchRecord[] {
  return [...appliedPatches];
}

export function clearAppliedPatchHistory(): void {
  appliedPatches.length = 0;
}
