import {
  chipDisplayLabel,
  gripChipToken,
  parseInlineComment,
} from "./inline-composer.js";
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

function parseLeadingMcpTagSequence(value: string): { tags: string[]; rest: string } | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("<")) return null;

  const tags: string[] = [];
  let index = 0;

  while (index < trimmed.length) {
    const match = /^<([a-z][a-z0-9]*)>/i.exec(trimmed.slice(index));
    if (!match) break;
    tags.push(match[1]!.toLowerCase());
    index += match[0].length;
  }

  if (!tags.length) return null;
  return { tags, rest: trimmed.slice(index).trim() };
}

/** Rebuild chip tokens from legacy MCP `<tag>`-only comments saved before token storage. */
function repairMcpFormattedComment(
  comment: string,
  pick: StoredPick,
  sessionPicks: StoredPick[],
): { chips: StoredPickChipRef[]; comment: string } | null {
  const parsed = parseLeadingMcpTagSequence(comment);
  if (!parsed) return null;

  const picks = sessionPicks.length ? sessionPicks : [pick];
  const usedByTag = new Map<string, number>();
  const chips: StoredPickChipRef[] = [];
  const tokenIds: string[] = [];

  for (const tag of parsed.tags) {
    const candidates = picks.filter((entry) => entry.tagName.toLowerCase() === tag);
    const used = usedByTag.get(tag) ?? 0;
    const matched = candidates[used] ?? candidates[0];
    if (!matched) return null;
    usedByTag.set(tag, used + 1);
    tokenIds.push(matched.id);
    chips.push(storedPickToChipRef(matched, matched.id));
  }

  const tokenComment =
    tokenIds.map((id) => gripChipToken(id)).join("") +
    (parsed.rest ? ` ${parsed.rest}` : "");

  return { chips, comment: tokenComment };
}

function stripDuplicateLeadingTagLabel(text: string, tag: string): string {
  let rest = text.trim();
  const label = chipDisplayLabel(tag);
  while (rest.startsWith(label)) {
    rest = rest.slice(label.length).trimStart();
  }
  return rest;
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
    const repaired = repairMcpFormattedComment(comment, pick, sessionPicks);
    if (repaired) return repaired;

    const chipId = pick.id;
    const tag = pick.tagName.toLowerCase();
    const trimmed = stripDuplicateLeadingTagLabel(comment.trim(), tag);
    return {
      chips: [storedPickToChipRef(pick, chipId)],
      comment: trimmed
        ? `${gripChipToken(chipId)} ${trimmed}`
        : gripChipToken(chipId),
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
