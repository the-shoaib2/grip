import {
  badgeDisplayLabel,
  badgeStateIndicator,
  chipRefToContextBadge,
  contextBadgeToChipRef,
  duplicateBadge,
  mergeBadgeRefresh,
  newChipId,
  ContextBadgeRegistry,
  type ContextBadge,
  type ContextBadgeGroup,
} from "@grip/core";
import type { InlineChipRef } from "@devtools/lib/inlineComposerDom/chips";

export type BadgeAction =
  | "remove"
  | "copy"
  | "duplicate"
  | "refresh"
  | "replace"
  | "group"
  | "ungroup"
  | "pin"
  | "unpin"
  | "lock"
  | "unlock"
  | "inspect"
  | "jumpToSource"
  | "openSourceFile";

export interface BadgeActionContext {
  registry: ContextBadgeRegistry;
  onRegistryChange?: () => void;
  onReplaceRequest?: (badgeId: string) => void;
  onInspectRequest?: (badge: ContextBadge) => void;
  onJumpToSource?: (badge: ContextBadge) => void;
}

export function badgeFromChipRef(ref: InlineChipRef, registry: ContextBadgeRegistry): ContextBadge {
  const existing = registry.get(ref.id);
  if (existing) return existing;
  const badge = chipRefToContextBadge(ref);
  registry.set(badge);
  return badge;
}

export function refreshBadge(
  badgeId: string,
  registry: ContextBadgeRegistry,
  resolver?: (badge: ContextBadge) => Partial<ContextBadge>,
): ContextBadge | undefined {
  const badge = registry.get(badgeId);
  if (!badge) return undefined;
  const resolving = mergeBadgeRefresh(badge, { state: "resolving" });
  registry.set(resolving);
  const patch = resolver?.(resolving) ?? { state: "ready" as const };
  const refreshed = mergeBadgeRefresh(resolving, patch);
  registry.set(refreshed);
  return refreshed;
}

export function executeBadgeAction(
  action: BadgeAction,
  badgeId: string,
  ctx: BadgeActionContext,
  options?: { selectedIds?: string[]; groupLabel?: string },
): void {
  const { registry, onRegistryChange } = ctx;
  const selected = options?.selectedIds?.length ? options.selectedIds : [badgeId];

  switch (action) {
    case "remove":
      for (const id of selected) registry.delete(id);
      break;
    case "copy":
      break;
    case "duplicate": {
      for (const id of selected) {
        const badge = registry.get(id);
        if (!badge) continue;
        const dup = duplicateBadge(badge, newChipId());
        registry.set(dup);
      }
      break;
    }
    case "refresh":
      for (const id of selected) refreshBadge(id, registry);
      break;
    case "replace":
      ctx.onReplaceRequest?.(badgeId);
      return;
    case "group": {
      const groupId = newChipId();
      const group: ContextBadgeGroup = {
        id: groupId,
        label: options?.groupLabel ?? "Group",
        badgeIds: selected,
        createdAt: Date.now(),
      };
      registry.setGroup(group);
      break;
    }
    case "ungroup": {
      const badge = registry.get(badgeId);
      if (badge?.groupId) registry.ungroup(badge.groupId);
      break;
    }
    case "pin":
      for (const id of selected) {
        const b = registry.get(id);
        if (b) registry.set({ ...b, pinned: true, updatedAt: Date.now() });
      }
      break;
    case "unpin":
      for (const id of selected) {
        const b = registry.get(id);
        if (b) registry.set({ ...b, pinned: false, updatedAt: Date.now() });
      }
      break;
    case "lock":
      for (const id of selected) {
        const b = registry.get(id);
        if (b) registry.set({ ...b, locked: true, updatedAt: Date.now() });
      }
      break;
    case "unlock":
      for (const id of selected) {
        const b = registry.get(id);
        if (b) registry.set({ ...b, locked: false, updatedAt: Date.now() });
      }
      break;
    case "inspect": {
      const badge = registry.get(badgeId);
      if (badge) ctx.onInspectRequest?.(badge);
      return;
    }
    case "jumpToSource":
    case "openSourceFile": {
      const badge = registry.get(badgeId);
      if (badge) ctx.onJumpToSource?.(badge);
      return;
    }
  }

  onRegistryChange?.();
}

export function formatBadgeClipboardJson(badge: ContextBadge): string {
  return JSON.stringify({ gripBadge: badge }, null, 0);
}

export function parseBadgeClipboardJson(text: string): ContextBadge | null {
  try {
    const data = JSON.parse(text) as { gripBadge?: ContextBadge };
    return data.gripBadge ?? null;
  } catch {
    return null;
  }
}

export function chipRefFromBadge(badge: ContextBadge): InlineChipRef {
  return contextBadgeToChipRef(badge) as InlineChipRef;
}

export function badgeLabelForChip(badge: ContextBadge): string {
  const indicator = badgeStateIndicator(badge.state);
  const label = badgeDisplayLabel(badge);
  const pin = badge.pinned ? "📌" : "";
  const lock = badge.locked ? "🔒" : "";
  return `${label}${indicator ? ` ${indicator}` : ""}${pin}${lock}`.trim();
}
