import {
  chipDisplayLabel,
  newChipId,
  type StoredPickChipRef,
} from "@grip/core";

export const INLINE_CHIP_CLASS = "grip-inline-chip";
export const INLINE_EDITOR_CLASS = "grip-inline-editor";

/** Inline chip in the picker context composer (includes stable id + clipboard metadata). */
export type InlineChipRef = StoredPickChipRef;

function applyChipMeta(chip: HTMLSpanElement, meta: InlineChipRef): void {
  chip.dataset.gripChip = meta.id;
  chip.dataset.tag = meta.tag.toLowerCase();
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
  };
}

export function createChipElement(
  meta: InlineChipRef,
  active = false,
): HTMLSpanElement {
  const chip = document.createElement("span");
  chip.className = `${INLINE_CHIP_CLASS}${active ? " grip-inline-chip-active" : ""}`;
  chip.contentEditable = "false";
  applyChipMeta(chip, meta);
  chip.textContent = chipDisplayLabel(meta.tag);
  return chip;
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

export function updateChipActiveStates(
  editor: HTMLElement,
  activeChipId?: string,
): void {
  editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`).forEach((chip) => {
    const isActive = chip.dataset.gripChip === activeChipId;
    chip.classList.toggle("grip-inline-chip-active", isActive);
  });
}

export function createDefaultChip(tag: string): InlineChipRef {
  return { id: newChipId(), tag: tag.toLowerCase() };
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
}): InlineChipRef {
  return {
    id: pick.chipId,
    tag: pick.tag,
    role: pick.role,
    css: pick.css,
    text: pick.text,
    name: pick.name,
    xpath: pick.xpath,
    rect: pick.rect,
    shadowDOM: pick.shadowDOM,
    iframe: pick.iframe,
  };
}

/** Zero-width space used as caret anchors around chips. */
export const ZWSP = "\u200B";
