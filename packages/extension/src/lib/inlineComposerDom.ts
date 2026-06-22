import {
  chipDisplayLabel,
  gripChipToken,
  newChipId,
  parseInlineComment,
} from "@grip/core";

export const INLINE_CHIP_CLASS = "grip-inline-chip";
export const INLINE_EDITOR_CLASS = "grip-inline-editor";

const ZWSP = "\u200B";

export interface InlineChipRef {
  id: string;
  tag: string;
}

export function createChipElement(
  chipId: string,
  tag: string,
  active = false,
): HTMLSpanElement {
  const chip = document.createElement("span");
  chip.className = `${INLINE_CHIP_CLASS}${active ? " grip-inline-chip-active" : ""}`;
  chip.contentEditable = "false";
  chip.dataset.gripChip = chipId;
  chip.dataset.tag = tag.toLowerCase();
  chip.title = chipDisplayLabel(tag);
  chip.textContent = chipDisplayLabel(tag);
  return chip;
}

export function serializeEditor(editor: HTMLElement): string {
  let out = "";

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += (node.textContent ?? "").replaceAll(ZWSP, "");
      return;
    }
    if (!(node instanceof HTMLElement)) return;

    const chipId = node.dataset.gripChip;
    if (chipId && node.classList.contains(INLINE_CHIP_CLASS)) {
      out += gripChipToken(chipId);
      return;
    }

    if (node.tagName === "BR") {
      out += "\n";
      return;
    }

    node.childNodes.forEach(walk);
  };

  editor.childNodes.forEach(walk);
  return out;
}

export function isEditorEmpty(editor: HTMLElement): boolean {
  const text = serializeEditor(editor).trim();
  return text.length === 0;
}

export function setEditorFromComment(
  editor: HTMLElement,
  value: string,
  chips: InlineChipRef[],
  activeChipId?: string,
): void {
  editor.innerHTML = "";
  const chipMap = new Map(chips.map((chip) => [chip.id, chip.tag]));
  const parts = parseInlineComment(value);

  if (!parts.length && chips.length === 1) {
    editor.appendChild(createChipElement(chips[0]!.id, chips[0]!.tag, true));
    editor.appendChild(document.createTextNode(ZWSP));
    return;
  }

  for (const part of parts) {
    if (part.type === "chip") {
      const tag = chipMap.get(part.id);
      if (!tag) continue;
      editor.appendChild(
        createChipElement(part.id, tag, part.id === activeChipId),
      );
      editor.appendChild(document.createTextNode(ZWSP));
      continue;
    }
    if (part.value) {
      editor.appendChild(document.createTextNode(part.value));
    }
  }

  if (isEditorEmpty(editor) && chips.length) {
    for (const chip of chips) {
      editor.appendChild(
        createChipElement(chip.id, chip.tag, chip.id === activeChipId),
      );
      editor.appendChild(document.createTextNode(ZWSP));
    }
  }

  if (!editor.childNodes.length) {
    editor.appendChild(document.createTextNode(""));
  }
}

export function insertChipAtSelection(
  editor: HTMLElement,
  chipId: string,
  tag: string,
  active = true,
): void {
  editor
    .querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`)
    .forEach((node) => node.classList.remove("grip-inline-chip-active"));

  const chip = createChipElement(chipId, tag, active);
  const spacer = document.createTextNode(ZWSP);
  const sel = window.getSelection();
  const range =
    sel?.rangeCount && editor.contains(sel.anchorNode)
      ? sel.getRangeAt(0)
      : null;

  if (range) {
    range.deleteContents();
    range.insertNode(spacer);
    range.insertNode(chip);
    placeCaretAfter(spacer);
    return;
  }

  editor.appendChild(chip);
  editor.appendChild(spacer);
  placeCaretAfter(spacer);
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

export function placeCaretAfter(node: Node): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function placeCaretAtEnd(editor: HTMLElement): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function focusEditor(editor: HTMLElement): void {
  editor.focus({ preventScroll: true });
  if (isEditorEmpty(editor)) placeCaretAtEnd(editor);
}

function nodeBeforeCaret(range: Range): Node | null {
  const { startContainer, startOffset } = range;
  if (startContainer.nodeType === Node.TEXT_NODE) {
    if (startOffset > 0) return null;
    return startContainer.previousSibling;
  }
  if (startContainer instanceof HTMLElement) {
    if (startOffset === 0) return startContainer.previousSibling;
    return startContainer.childNodes[startOffset - 1] ?? null;
  }
  return null;
}

function nodeAfterCaret(range: Range): Node | null {
  const { startContainer, startOffset } = range;
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const text = startContainer.textContent ?? "";
    if (startOffset < text.replaceAll(ZWSP, "").length) return null;
    return startContainer.nextSibling;
  }
  if (startContainer instanceof HTMLElement) {
    return startContainer.childNodes[startOffset] ?? null;
  }
  return null;
}

function asChip(node: Node | null): HTMLElement | null {
  if (!(node instanceof HTMLElement)) return null;
  return node.classList.contains(INLINE_CHIP_CLASS) ? node : null;
}

export function chipAdjacentToCaret(
  editor: HTMLElement,
  direction: "before" | "after",
): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.startContainer)) return null;
  const adjacent =
    direction === "before" ? nodeBeforeCaret(range) : nodeAfterCaret(range);
  return asChip(adjacent);
}

export function handleEditorKeydown(
  editor: HTMLElement,
  e: KeyboardEvent,
  onChipRemoved: (chipId: string) => void,
): boolean {
  if (e.key !== "Backspace" && e.key !== "Delete") return false;

  const sel = window.getSelection();
  if (!sel?.rangeCount) return false;

  if (!sel.isCollapsed) {
    const range = sel.getRangeAt(0);
    const chips = editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`);
    let removed = false;
    chips.forEach((chip) => {
      if (!removed && range.intersectsNode(chip)) {
        e.preventDefault();
        const chipId = chip.dataset.gripChip;
        removeChipElement(chip);
        if (chipId) onChipRemoved(chipId);
        removed = true;
      }
    });
    return removed;
  }

  const direction = e.key === "Backspace" ? "before" : "after";
  const chip = chipAdjacentToCaret(editor, direction);
  if (!chip) return false;

  e.preventDefault();
  const chipId = chip.dataset.gripChip;
  removeChipElement(chip);
  if (chipId) onChipRemoved(chipId);
  return true;
}

export function createDefaultChip(tag: string): InlineChipRef {
  return { id: newChipId(), tag: tag.toLowerCase() };
}
