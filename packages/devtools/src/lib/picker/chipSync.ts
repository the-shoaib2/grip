import { describeElement, newChipId, type StoredPickChipRef } from "@grip/core";
import type { PendingPick } from "@/lib/picker/types";

export function toPendingPick(el: Element): PendingPick {
  const desc = describeElement(el);
  return {
    chipId: newChipId(),
    el,
    css: desc.css,
    tag: desc.tagName.toLowerCase(),
    role: desc.role?.toLowerCase() ?? "",
    text: desc.innerText,
    name: desc.name,
    xpath: desc.xpath,
    rect: desc.rect,
    shadowDOM: desc.shadowDOM,
    iframe: desc.iframe,
    frameworkContext: desc.frameworkContext,
  };
}

export function syncPendingFromStoredChips(
  chips: StoredPickChipRef[],
  pendingElements: PendingPick[],
): { pending: PendingPick[]; anchor: Element | null } {
  const next: PendingPick[] = [];
  let anchor: Element | null = null;

  for (const chip of chips) {
    if (!chip.css) continue;
    const el = document.querySelector(chip.css);
    if (!el) continue;
    const existing = next.find((item) => item.css === chip.css);
    if (existing) {
      existing.chipId = chip.id;
      continue;
    }
    const pending = toPendingPick(el);
    pending.chipId = chip.id;
    next.push(pending);
    anchor ??= el;
  }

  if (next[0]) {
    anchor = next[0].el;
  }

  return { pending: next, anchor };
}
