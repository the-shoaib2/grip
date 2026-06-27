import { formatChipForClipboard } from "@grip/core";
import { chipMetaFromElement, INLINE_CHIP_CLASS, ZWSP, type InlineChipRef } from "@devtools/lib/inlineComposerDom/chips";
import { selectionRangeInEditor } from "@devtools/lib/inlineComposerDom/selection";

function serializeFragmentForClipboard(root: ParentNode): string {
  let out = "";

  const appendChip = (meta: InlineChipRef) => {
    const block = formatChipForClipboard(meta);
    if (out.length > 0 && !out.endsWith("\n\n")) {
      if (!out.endsWith("\n")) out += "\n";
      out += "\n";
    }
    out += block;
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += (node.textContent ?? "").replaceAll(ZWSP, "");
      return;
    }
    if (!(node instanceof HTMLElement)) return;

    if (node.classList.contains(INLINE_CHIP_CLASS)) {
      const meta = chipMetaFromElement(node);
      if (meta) appendChip(meta);
      return;
    }

    if (node.tagName === "BR") {
      out += "\n";
      return;
    }

    node.childNodes.forEach(walk);
  };

  root.childNodes.forEach(walk);
  return out;
}

/** Clipboard text: plain text stays text, badges copy full element metadata. */
export function serializeSelectionForClipboard(editor: HTMLElement): string | null {
  const ctx = selectionRangeInEditor(editor);
  if (!ctx) return null;
  if (ctx.sel.isCollapsed) return "";

  const fragment = ctx.range.cloneContents();
  const container = document.createElement("div");
  container.appendChild(fragment);
  return serializeFragmentForClipboard(container);
}

export function bindEditorClipboard(editor: HTMLElement): () => void {
  const onCopy = (e: ClipboardEvent) => {
    const text = serializeSelectionForClipboard(editor);
    if (!text) return;
    e.preventDefault();
    e.clipboardData?.setData("text/plain", text);
  };

  editor.addEventListener("copy", onCopy);
  return () => editor.removeEventListener("copy", onCopy);
}

export function writeClipboardText(text: string): void {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
