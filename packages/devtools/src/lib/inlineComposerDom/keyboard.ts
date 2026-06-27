import { INLINE_CHIP_CLASS, removeChipElement } from "@devtools/lib/inlineComposerDom/chips";
import { serializeSelectionForClipboard, writeClipboardText } from "@devtools/lib/inlineComposerDom/clipboard";
import {
  chipAdjacentToCaret,
  selectAllInEditor,
  selectionRangeInEditor,
} from "@devtools/lib/inlineComposerDom/selection";

function syncEditorInput(editor: HTMLElement): void {
  editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

/** Primary modifier: Ctrl on Windows/Linux, Cmd on macOS. */
export function isPrimaryMod(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey;
}

export function isPrimaryModShortcut(e: KeyboardEvent, key: string): boolean {
  return isPrimaryMod(e) && !e.altKey && e.key.toLowerCase() === key.toLowerCase();
}

export function deleteSelectionInEditor(
  editor: HTMLElement,
  onChipRemoved: (chipId: string) => void,
): void {
  const ctx = selectionRangeInEditor(editor);
  if (!ctx || ctx.sel.isCollapsed) return;

  const removedChipIds: string[] = [];
  editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`).forEach((chip) => {
    if (ctx.range.intersectsNode(chip)) {
      const chipId = chip.dataset.gripChip;
      if (chipId) removedChipIds.push(chipId);
    }
  });

  ctx.range.deleteContents();
  for (const chipId of removedChipIds) onChipRemoved(chipId);
  syncEditorInput(editor);
}

function handleEditorShortcuts(
  editor: HTMLElement,
  e: KeyboardEvent,
  onChipRemoved: (chipId: string) => void,
): boolean {
  if (!isPrimaryMod(e) || e.altKey) return false;

  const key = e.key.toLowerCase();

  if (key === "a") {
    e.preventDefault();
    selectAllInEditor(editor);
    return true;
  }

  if (key === "c") {
    const text = serializeSelectionForClipboard(editor);
    if (text === null || text === "") return false;
    e.preventDefault();
    writeClipboardText(text);
    return true;
  }

  if (key === "x") {
    const text = serializeSelectionForClipboard(editor);
    if (text === null || text === "") return false;
    e.preventDefault();
    writeClipboardText(text);
    deleteSelectionInEditor(editor, onChipRemoved);
    return true;
  }

  if (key === "v") {
    return false;
  }

  if (key === "z" && !e.shiftKey) {
    e.preventDefault();
    document.execCommand("undo");
    syncEditorInput(editor);
    return true;
  }

  if (key === "y" || (key === "z" && e.shiftKey)) {
    e.preventDefault();
    document.execCommand("redo");
    syncEditorInput(editor);
    return true;
  }

  return false;
}

export function handleEditorKeydown(
  editor: HTMLElement,
  e: KeyboardEvent,
  onChipRemoved: (chipId: string) => void,
): boolean {
  if (handleEditorShortcuts(editor, e, onChipRemoved)) return true;

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
        syncEditorInput(editor);
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
  syncEditorInput(editor);
  return true;
}
