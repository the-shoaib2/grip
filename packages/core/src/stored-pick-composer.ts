import { gripChipToken, parseInlineComment } from "./inline-composer.js";
import type { StoredPick } from "./types/messages.js";

export interface StoredPickChipRef {
  id: string;
  tag: string;
  role?: string;
  css?: string;
  xpath?: string;
  text?: string;
  name?: string;
  rect?: { top: number; left: number; width: number; height: number };
  shadowDOM?: boolean;
  iframe?: string;
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
  };
}

export function composerStateForStoredPick(pick: StoredPick): {
  chips: StoredPickChipRef[];
  comment: string;
} {
  const comment = pick.comment ?? "";
  const parts = parseInlineComment(comment);
  const chipIds = parts
    .filter((part): part is { type: "chip"; id: string } => part.type === "chip")
    .map((part) => part.id);

  if (!chipIds.length) {
    const chipId = pick.id;
    const trimmed = comment.trim();
    return {
      chips: [storedPickToChipRef(pick, chipId)],
      comment: trimmed ? `${gripChipToken(chipId)} ${trimmed}` : gripChipToken(chipId),
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
