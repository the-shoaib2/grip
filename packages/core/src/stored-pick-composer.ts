import { gripChipToken, parseInlineComment } from "./inline-composer.js";
import type { ElementRect } from "./types/a11y.js";
import type { FrameworkContext } from "./types/framework.js";
import type { StoredPick } from "./types/messages.js";

export interface StoredPickChipRef {
  id: string;
  tag: string;
  role?: string;
  css?: string;
  xpath?: string;
  text?: string;
  name?: string;
  rect?: ElementRect;
  shadowDOM?: boolean;
  iframe?: string;
  frameworkContext?: FrameworkContext | null;
}

/** Maps stored pick chip refs for inline composer DOM (same shape, explicit conversion point). */
export function storedPickChipsToInlineRefs(
  chips: StoredPickChipRef[],
): StoredPickChipRef[] {
  return chips;
}

export function storedPickToChipRef(pick: StoredPick, chipId?: string): StoredPickChipRef {
  return {
    id: chipId ?? pick.id,
    tag: pick.tagName.toLowerCase(),
    role: pick.role,
    css: pick.css,
    xpath: pick.xpath,
    text: pick.innerText,
    name: pick.name,
    rect: pick.rect,
    shadowDOM: pick.shadowDOM,
    iframe: pick.iframe,
    frameworkContext: pick.frameworkContext,
  };
}

export function composerStateForStoredPick(
  pick: StoredPick,
  sessionPicks: StoredPick[] = [],
): {
  chips: StoredPickChipRef[];
  comment: string;
} {
  const comment = pick.comment ?? "";
  const parts = parseInlineComment(comment);
  const chipIds = parts
    .filter((part): part is { type: "chip"; id: string } => part.type === "chip")
    .map((part) => part.id);

  const lookup = new Map<string, StoredPick>(sessionPicks.map((p) => [p.id, p]));

  if (!chipIds.length) {
    const chipId = pick.id;
    const trimmed = comment.trim();
    return {
      chips: [storedPickToChipRef(pick, chipId)],
      comment: trimmed ? `${gripChipToken(chipId)} ${trimmed}` : gripChipToken(chipId),
    };
  }

  return {
    chips: chipIds.map((id) => {
      const matched = lookup.get(id) ?? pick;
      return storedPickToChipRef(matched, id);
    }),
    comment,
  };
}

export function formatPickIndexLabel(index: number, total: number): string {
  const safeTotal = Math.max(total, 1);
  const safeIndex = Math.min(Math.max(index, 1), safeTotal);
  return `[${safeIndex}:${safeTotal}]`;
}
