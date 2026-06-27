import type { ElementRect } from "./types/a11y.js";
import type { FrameworkContext } from "./types/framework.js";
import type { StoredPickChipRef } from "./stored-pick-composer.js";

/** Lifecycle state for a context badge. */
export type ContextBadgeState =
  | "idle"
  | "selecting"
  | "resolving"
  | "ready"
  | "outdated"
  | "missing"
  | "processing"
  | "patching"
  | "success"
  | "failed";

export interface ContextBadge {
  id: string;
  component: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  sourceCode?: string;
  sourceHash?: string;
  framework?: string;
  parentComponents?: string[];
  childComponents?: string[];
  dependencies?: string[];
  sessionId?: string;
  createdAt: number;
  updatedAt: number;
  state: ContextBadgeState;
  pinned?: boolean;
  locked?: boolean;
  groupId?: string;
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

export interface ContextBadgeGroup {
  id: string;
  label: string;
  badgeIds: string[];
  createdAt: number;
}

export interface ContextInstructionBlock {
  id: string;
  contexts: ContextBadge[];
  groups: ContextBadgeGroup[];
  instructions: string[];
}

export interface GripDocument {
  blocks: ContextInstructionBlock[];
}

export const GRIP_GROUP_TOKEN_RE =
  /\[\[grip-group:([a-zA-Z0-9_-]+)(?::([a-zA-Z0-9_,-]+))?\]\]/g;
export const GRIP_GROUP_END_TOKEN = "[[/grip-group]]";

export function gripGroupToken(groupId: string, badgeIds?: string[]): string {
  if (!badgeIds?.length) return `[[grip-group:${groupId}]]`;
  return `[[grip-group:${groupId}:${badgeIds.join(",")}]]`;
}

/** Stable display label for a badge (component name preferred). */
export function badgeDisplayLabel(badge: Pick<ContextBadge, "component" | "tag">): string {
  const name = badge.component?.trim() || badge.tag;
  const normalized = name.toLowerCase().replace(/^<|>$/g, "");
  return normalized.startsWith("<") ? normalized : `<${normalized}>`;
}

export function badgeStateIndicator(state: ContextBadgeState): string {
  switch (state) {
    case "ready":
    case "success":
      return "✓";
    case "outdated":
      return "↻";
    case "missing":
      return "?";
    case "resolving":
    case "processing":
    case "patching":
      return "…";
    case "failed":
      return "!";
    default:
      return "";
  }
}

/** Lightweight hash for stale source detection. */
export function computeSourceHash(source: string): string {
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function chipRefToContextBadge(ref: StoredPickChipRef): ContextBadge {
  const fw = ref.frameworkContext;
  const now = Date.now();
  return {
    id: ref.id,
    component: fw?.componentName ?? ref.tag,
    filePath: fw?.file,
    lineStart: fw?.line,
    lineEnd: fw?.line,
    framework: fw?.framework,
    createdAt: now,
    updatedAt: now,
    state: fw?.file ? "ready" : "idle",
    tag: ref.tag,
    role: ref.role,
    css: ref.css,
    xpath: ref.xpath,
    text: ref.text,
    name: ref.name,
    rect: ref.rect,
    shadowDOM: ref.shadowDOM,
    iframe: ref.iframe,
    frameworkContext: ref.frameworkContext,
  };
}

export function contextBadgeToChipRef(badge: ContextBadge): StoredPickChipRef {
  return {
    id: badge.id,
    tag: badge.tag,
    role: badge.role,
    css: badge.css,
    xpath: badge.xpath,
    text: badge.text,
    name: badge.name,
    rect: badge.rect,
    shadowDOM: badge.shadowDOM,
    iframe: badge.iframe,
    frameworkContext: badge.frameworkContext ?? {
      framework: badge.framework ?? "unknown",
      file: badge.filePath,
      line: badge.lineStart,
      componentName: badge.component,
    },
    // extended fields stored via badge registry — chip ref stays compatible
  };
}

export function mergeBadgeRefresh(
  badge: ContextBadge,
  patch: Partial<ContextBadge>,
): ContextBadge {
  return {
    ...badge,
    ...patch,
    updatedAt: Date.now(),
    state: patch.state ?? "ready",
  };
}

export function markBadgeOutdatedIfHashChanged(
  badge: ContextBadge,
  currentSource: string,
): ContextBadge {
  const hash = computeSourceHash(currentSource);
  if (badge.sourceHash && badge.sourceHash !== hash) {
    return { ...badge, state: "outdated", sourceHash: hash, updatedAt: Date.now() };
  }
  return { ...badge, sourceHash: hash, sourceCode: currentSource, state: "ready", updatedAt: Date.now() };
}

export function duplicateBadge(badge: ContextBadge, newId: string): ContextBadge {
  const now = Date.now();
  return {
    ...badge,
    id: newId,
    createdAt: now,
    updatedAt: now,
    pinned: false,
    locked: false,
  };
}

export class ContextBadgeRegistry {
  private badges = new Map<string, ContextBadge>();
  private groups = new Map<string, ContextBadgeGroup>();

  set(badge: ContextBadge): void {
    this.badges.set(badge.id, badge);
  }

  get(id: string): ContextBadge | undefined {
    return this.badges.get(id);
  }

  delete(id: string): boolean {
    return this.badges.delete(id);
  }

  values(): ContextBadge[] {
    return [...this.badges.values()];
  }

  setGroup(group: ContextBadgeGroup): void {
    this.groups.set(group.id, group);
    for (const badgeId of group.badgeIds) {
      const badge = this.badges.get(badgeId);
      if (badge) this.badges.set(badgeId, { ...badge, groupId: group.id });
    }
  }

  getGroup(id: string): ContextBadgeGroup | undefined {
    return this.groups.get(id);
  }

  ungroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;
    for (const badgeId of group.badgeIds) {
      const badge = this.badges.get(badgeId);
      if (badge) this.badges.set(badgeId, { ...badge, groupId: undefined });
    }
    this.groups.delete(groupId);
  }

  groupsList(): ContextBadgeGroup[] {
    return [...this.groups.values()];
  }

  loadFromChipRefs(refs: StoredPickChipRef[]): void {
    for (const ref of refs) {
      const existing = this.badges.get(ref.id);
      if (existing) {
        this.badges.set(ref.id, { ...chipRefToContextBadge(ref), ...existing, id: ref.id });
      } else {
        this.badges.set(ref.id, chipRefToContextBadge(ref));
      }
    }
  }

  toChipRefs(): StoredPickChipRef[] {
    return this.values().map(contextBadgeToChipRef);
  }
}
