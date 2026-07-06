import { gripChipToken, parseInlineComment } from "grip-dev";
import {
  createChipElement,
  INLINE_CHIP_CLASS,
  type InlineChipRef,
  ZWSP,
} from "@devtools/lib/inlineComposerDom/chips";
import { placeCaretAtEnd } from "@devtools/lib/inlineComposerDom/selection";

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

export interface SetEditorFromCommentOptions {
  /** Move caret to the end after rebuilding content (default false). */
  caretAtEnd?: boolean;
}

export function setEditorFromComment(
  editor: HTMLElement,
  value: string,
  chips: InlineChipRef[],
  activeChipId?: string,
  options?: SetEditorFromCommentOptions,
): void {
  editor.innerHTML = "";
  const parts = parseInlineComment(value);
  const hasChipTokens = parts.some((p) => p.type === "chip");

  if (!parts.length && chips.length === 1) {
    editor.appendChild(createChipElement(chips[0]!, true));
    editor.appendChild(document.createTextNode(ZWSP));
    if (options?.caretAtEnd) {
      requestAnimationFrame(() => {
        editor.focus({ preventScroll: true });
        placeCaretAtEnd(editor);
      });
    }
    return;
  }

  for (const part of parts) {
    if (part.type === "chip") {
      const chipMeta = chips.find((chip) => chip.id === part.id);
      if (!chipMeta) continue;
      editor.appendChild(
        createChipElement(chipMeta, part.id === activeChipId),
      );
      editor.appendChild(document.createTextNode(ZWSP));
      continue;
    }
    if (part.value) {
      editor.appendChild(document.createTextNode(part.value));
    }
  }

  // Only inject chips when no token was present in the original value at all
  if (!hasChipTokens && isEditorEmpty(editor) && chips.length) {
    for (const chip of chips) {
      editor.appendChild(createChipElement(chip, chip.id === activeChipId));
      editor.appendChild(document.createTextNode(ZWSP));
    }
  }

  if (!editor.childNodes.length) {
    editor.appendChild(document.createTextNode(""));
  }

  if (options?.caretAtEnd) {
    requestAnimationFrame(() => {
      editor.focus({ preventScroll: true });
      placeCaretAtEnd(editor);
    });
  }
}
