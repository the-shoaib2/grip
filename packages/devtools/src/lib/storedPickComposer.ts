import { parseInlineComment, type StoredPick } from "@grip/core";
import type { InlineChipRef } from "./inlineComposerDom";

export function storedPickToChipRef(pick: StoredPick, chipId?: string): InlineChipRef {
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
  };
}

/** Chip metadata + comment text for the session composer. */
export function composerStateForStoredPick(pick: StoredPick): {
  chips: InlineChipRef[];
  comment: string;
} {
  const comment = pick.comment ?? "";
  const parts = parseInlineComment(comment);
  const chipIds = parts
    .filter((part): part is { type: "chip"; id: string } => part.type === "chip")
    .map((part) => part.id);

  if (!chipIds.length) {
    return {
      chips: [storedPickToChipRef(pick, pick.id)],
      comment,
    };
  }

  return {
    chips: chipIds.map((id) => storedPickToChipRef(pick, id)),
    comment,
  };
}

export function formatPickIndexLabel(index: number, total: number): string {
  const safeTotal = Math.max(total, 1);
  const safeIndex = Math.min(Math.max(index, 1), safeTotal);
  return `[${safeIndex}:${safeTotal}]`;
}
