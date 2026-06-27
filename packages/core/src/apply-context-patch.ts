import { applyPatch } from "./patch-engine.js";
import { recordAppliedPatch } from "./patch-history.js";
import {
  validateContextEnginePatch,
  type ContextEnginePatch,
  type ValidatePatchOptions,
} from "./patch-validator.js";

export interface ApplyContextEnginePatchResult {
  ok: boolean;
  errors: string[];
  recordId?: string;
}

/** Validate and apply a Context Engine patch (host-side). */
export async function applyContextEnginePatch(
  patch: ContextEnginePatch,
  options?: ValidatePatchOptions,
): Promise<ApplyContextEnginePatchResult> {
  const validation = await validateContextEnginePatch(patch, options);
  if (!validation.valid || !validation.patchOptions) {
    return { ok: false, errors: validation.errors };
  }

  await applyPatch(validation.patchOptions);
  const record = recordAppliedPatch(patch, validation.patchOptions);
  return { ok: true, errors: [], recordId: record.id };
}
