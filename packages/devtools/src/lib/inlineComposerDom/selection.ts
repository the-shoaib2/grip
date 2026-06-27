import { createChipElement, INLINE_CHIP_CLASS, type InlineChipRef, ZWSP } from "@/lib/inlineComposerDom/chips";
import { serializeEditor } from "@/lib/inlineComposerDom/serialize";

export function placeCaretAfter(node: Node): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Place the caret at the last typable position (after chips, at end of trailing text). */
export function placeCaretAtEnd(editor: HTMLElement): void {
  const sel = window.getSelection();
  if (!sel) return;

  const range = document.createRange();
  const last = editor.lastChild;

  if (!last) {
    range.setStart(editor, 0);
    range.collapse(true);
  } else if (last.nodeType === Node.TEXT_NODE) {
    range.setStart(last, (last.textContent ?? "").length);
    range.collapse(true);
  } else {
    range.setStartAfter(last);
    range.collapse(true);
  }

  sel.removeAllRanges();
  sel.addRange(range);
}

export type FocusEditorCaret = "end" | "preserve";

export interface FocusEditorOptions {
  /** Default "end" — compose flows should type after chips, not before them. */
  caret?: FocusEditorCaret;
}

export function focusEditor(
  editor: HTMLElement,
  options: FocusEditorOptions = {},
): void {
  const caret = options.caret ?? "end";
  editor.focus({ preventScroll: true });
  if (caret === "end") placeCaretAtEnd(editor);
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

export function selectAllInEditor(editor: HTMLElement): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(editor);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function selectChipElement(chip: HTMLElement): void {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(chip);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function selectionRangeInEditor(
  editor: HTMLElement,
): { sel: Selection; range: Range } | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;
  return { sel, range };
}

/** Serialize the current selection when it lies inside the editor. */
export function serializeEditorSelection(editor: HTMLElement): string | null {
  const ctx = selectionRangeInEditor(editor);
  if (!ctx) return null;
  if (ctx.sel.isCollapsed) return "";

  const fragment = ctx.range.cloneContents();
  const container = document.createElement("div");
  container.appendChild(fragment);
  return serializeEditor(container);
}

export function insertChipAtSelection(
  editor: HTMLElement,
  meta: InlineChipRef,
  active = true,
): void {
  editor
    .querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`)
    .forEach((node) => node.classList.remove("grip-inline-chip-active"));

  const chip = createChipElement(meta, active);
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
