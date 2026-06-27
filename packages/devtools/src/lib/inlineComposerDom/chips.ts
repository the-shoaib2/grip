import {
  badgeDisplayLabel,
  badgeStateIndicator,
  chipDisplayLabel,
  newChipId,
  type ContextBadge,
  type FrameworkContext,
  type StoredPickChipRef,
} from "@grip/core";

export const INLINE_CHIP_CLASS = "grip-inline-chip";
export const INLINE_CHIP_GROUP_CLASS = "grip-inline-chip-group";
export const INLINE_EDITOR_CLASS = "grip-inline-editor";

/** Inline chip in the picker context composer (includes stable id + clipboard metadata). */
export type InlineChipRef = StoredPickChipRef & {
  state?: ContextBadge["state"];
  component?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  sourceHash?: string;
  groupId?: string;
  pinned?: boolean;
  locked?: boolean;
  createdAt?: number;
  updatedAt?: number;
  parentComponents?: string[];
  childComponents?: string[];
};

function applyChipMeta(chip: HTMLSpanElement, meta: InlineChipRef): void {
  chip.dataset.gripChip = meta.id;
  chip.dataset.tag = meta.tag.toLowerCase();
  if (meta.component) chip.dataset.component = meta.component;
  if (meta.role) chip.dataset.role = meta.role;
  if (meta.css) chip.dataset.css = meta.css;
  if (meta.text) chip.dataset.text = meta.text;
  if (meta.name) chip.dataset.name = meta.name;
  if (meta.xpath) chip.dataset.xpath = meta.xpath;
  if (meta.rect) chip.dataset.rect = JSON.stringify(meta.rect);
  if (meta.shadowDOM !== undefined) {
    chip.dataset.shadowDom = meta.shadowDOM ? "1" : "0";
  }
  if (meta.iframe) chip.dataset.iframe = meta.iframe;
  if (meta.state) chip.dataset.state = meta.state;
  if (meta.filePath) chip.dataset.filePath = meta.filePath;
  if (meta.lineStart !== undefined) chip.dataset.lineStart = String(meta.lineStart);
  if (meta.lineEnd !== undefined) chip.dataset.lineEnd = String(meta.lineEnd);
  if (meta.sourceHash) chip.dataset.sourceHash = meta.sourceHash;
  if (meta.groupId) chip.dataset.groupId = meta.groupId;
  if (meta.pinned) chip.dataset.pinned = "1";
  if (meta.locked) chip.dataset.locked = "1";
  if (meta.createdAt) chip.dataset.createdAt = String(meta.createdAt);
  if (meta.updatedAt) chip.dataset.updatedAt = String(meta.updatedAt);
  if (meta.parentComponents?.length) {
    chip.dataset.parentComponents = meta.parentComponents.join(",");
  }
  if (meta.childComponents?.length) {
    chip.dataset.childComponents = meta.childComponents.join(",");
  }
  if (meta.frameworkContext) {
    chip.dataset.framework = meta.frameworkContext.framework;
    if (meta.frameworkContext.file) chip.dataset.frameworkFile = meta.frameworkContext.file;
    if (meta.frameworkContext.line !== undefined) {
      chip.dataset.frameworkLine = String(meta.frameworkContext.line);
    }
    if (meta.frameworkContext.componentName) {
      chip.dataset.frameworkComponent = meta.frameworkContext.componentName;
    }
  }
}

export function chipLabelText(meta: InlineChipRef): string {
  const component = meta.component ?? meta.frameworkContext?.componentName;
  const base = component
    ? badgeDisplayLabel({ component, tag: meta.tag })
    : chipDisplayLabel(meta.tag);
  const indicator = meta.state ? badgeStateIndicator(meta.state) : "";
  const suffix = [indicator, meta.pinned ? "📌" : "", meta.locked ? "🔒" : ""]
    .filter(Boolean)
    .join(" ");
  return suffix ? `${base} ${suffix}` : base;
}

export function chipMetaFromElement(chip: HTMLElement): InlineChipRef | null {
  const id = chip.dataset.gripChip;
  const tag = chip.dataset.tag;
  if (!id || !tag) return null;

  let rect: InlineChipRef["rect"];
  if (chip.dataset.rect) {
    try {
      rect = JSON.parse(chip.dataset.rect) as InlineChipRef["rect"];
    } catch {
      rect = undefined;
    }
  }

  return {
    id,
    tag,
    component: chip.dataset.component,
    role: chip.dataset.role,
    css: chip.dataset.css,
    text: chip.dataset.text,
    name: chip.dataset.name,
    xpath: chip.dataset.xpath,
    rect,
    shadowDOM: chip.dataset.shadowDom
      ? chip.dataset.shadowDom === "1"
      : undefined,
    iframe: chip.dataset.iframe,
    state: chip.dataset.state as InlineChipRef["state"],
    filePath: chip.dataset.filePath,
    lineStart: chip.dataset.lineStart ? Number(chip.dataset.lineStart) : undefined,
    lineEnd: chip.dataset.lineEnd ? Number(chip.dataset.lineEnd) : undefined,
    sourceHash: chip.dataset.sourceHash,
    groupId: chip.dataset.groupId,
    pinned: chip.dataset.pinned === "1",
    locked: chip.dataset.locked === "1",
    createdAt: chip.dataset.createdAt ? Number(chip.dataset.createdAt) : undefined,
    updatedAt: chip.dataset.updatedAt ? Number(chip.dataset.updatedAt) : undefined,
    parentComponents: chip.dataset.parentComponents?.split(",").filter(Boolean),
    childComponents: chip.dataset.childComponents?.split(",").filter(Boolean),
    frameworkContext: chip.dataset.framework
      ? {
          framework: chip.dataset.framework,
          file: chip.dataset.frameworkFile ?? chip.dataset.filePath,
          line: chip.dataset.frameworkLine
            ? Number(chip.dataset.frameworkLine)
            : chip.dataset.lineStart
              ? Number(chip.dataset.lineStart)
              : undefined,
          componentName: chip.dataset.frameworkComponent ?? chip.dataset.component,
        }
      : undefined,
  };
}

export function createChipElement(
  meta: InlineChipRef,
  active = false,
  selected = false,
): HTMLSpanElement {
  const chip = document.createElement("span");
  const stateClass = meta.state ? ` grip-inline-chip-${meta.state}` : "";
  const pinClass = meta.pinned ? " grip-inline-chip-pinned" : "";
  const lockClass = meta.locked ? " grip-inline-chip-locked" : "";
  chip.className = `${INLINE_CHIP_CLASS}${stateClass}${pinClass}${lockClass}${
    active ? " grip-inline-chip-active" : ""
  }${selected ? " grip-inline-chip-selected" : ""}`;
  chip.contentEditable = "false";
  chip.draggable = !meta.locked;
  applyChipMeta(chip, meta);
  chip.textContent = chipLabelText(meta);
  return chip;
}

export function updateChipElement(chip: HTMLElement, meta: InlineChipRef): void {
  if (!(chip instanceof HTMLSpanElement)) return;
  applyChipMeta(chip, meta);
  chip.textContent = chipLabelText(meta);
  chip.draggable = !meta.locked;
  chip.classList.remove(
    "grip-inline-chip-ready",
    "grip-inline-chip-outdated",
    "grip-inline-chip-missing",
    "grip-inline-chip-processing",
    "grip-inline-chip-failed",
    "grip-inline-chip-pinned",
    "grip-inline-chip-locked",
  );
  if (meta.state) chip.classList.add(`grip-inline-chip-${meta.state}`);
  if (meta.pinned) chip.classList.add("grip-inline-chip-pinned");
  if (meta.locked) chip.classList.add("grip-inline-chip-locked");
}

export function createChipGroupElement(
  label: string,
  groupId: string,
  chips: HTMLSpanElement[],
): HTMLSpanElement {
  const group = document.createElement("span");
  group.className = INLINE_CHIP_GROUP_CLASS;
  group.contentEditable = "false";
  group.dataset.gripGroup = groupId;
  group.dataset.groupLabel = label;

  const head = document.createElement("span");
  head.className = "grip-inline-chip-group-label";
  head.textContent = label;
  group.appendChild(head);

  const body = document.createElement("span");
  body.className = "grip-inline-chip-group-body";
  for (const chip of chips) {
    chip.dataset.groupId = groupId;
    body.appendChild(chip);
  }
  group.appendChild(body);
  return group;
}

export function removeChipElement(chip: HTMLElement): void {
  const next = chip.nextSibling;
  const prev = chip.previousSibling;
  chip.remove();
  if (next?.nodeType === Node.TEXT_NODE && next.textContent === ZWSP) {
    next.remove();
  } else if (prev?.nodeType === Node.TEXT_NODE && prev.textContent === ZWSP) {
    prev.remove();
  }
}

export function findChipElement(
  editor: HTMLElement,
  chipId: string,
): HTMLElement | null {
  return editor.querySelector<HTMLElement>(`[data-grip-chip="${chipId}"]`);
}

export function listChipElements(editor: HTMLElement): HTMLElement[] {
  return Array.from(editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`));
}

export function updateChipActiveStates(
  editor: HTMLElement,
  activeChipId?: string,
): void {
  editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`).forEach((chip) => {
    const isActive = chip.dataset.gripChip === activeChipId;
    chip.classList.toggle("grip-inline-chip-active", isActive);
  });
}

export function updateChipSelectedStates(
  editor: HTMLElement,
  selectedIds: Set<string>,
): void {
  editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`).forEach((chip) => {
    const id = chip.dataset.gripChip;
    chip.classList.toggle("grip-inline-chip-selected", Boolean(id && selectedIds.has(id)));
  });
}

export function createDefaultChip(tag: string): InlineChipRef {
  return { id: newChipId(), tag: tag.toLowerCase(), state: "idle", createdAt: Date.now(), updatedAt: Date.now() };
}

/** Map a pending picker element to inline chip metadata. */
export function toInlineChipRef(pick: {
  chipId: string;
  tag: string;
  role: string;
  text: string;
  name: string;
  css: string;
  xpath: string;
  rect: { top: number; left: number; width: number; height: number };
  shadowDOM: boolean;
  iframe: string;
  frameworkContext?: FrameworkContext | null;
}): InlineChipRef {
  const fw = pick.frameworkContext;
  const now = Date.now();
  return {
    id: pick.chipId,
    tag: pick.tag,
    component: fw?.componentName ?? pick.tag,
    role: pick.role,
    css: pick.css,
    text: pick.text,
    name: pick.name,
    xpath: pick.xpath,
    rect: pick.rect,
    shadowDOM: pick.shadowDOM,
    iframe: pick.iframe,
    frameworkContext: pick.frameworkContext,
    filePath: fw?.file,
    lineStart: fw?.line,
    lineEnd: fw?.line,
    state: fw?.file ? "ready" : "idle",
    createdAt: now,
    updatedAt: now,
  };
}

/** Zero-width space used as caret anchors around chips. */
export const ZWSP = "\u200B";
