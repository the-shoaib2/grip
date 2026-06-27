import { INLINE_CHIP_CLASS, ZWSP } from "@devtools/lib/inlineComposerDom/chips";

export function bindChipDragDrop(
  editor: HTMLElement,
  onReorder?: () => void,
): () => void {
  let dragChip: HTMLElement | null = null;

  const onDragStart = (e: DragEvent) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>(`.${INLINE_CHIP_CLASS}`);
    if (!chip || chip.dataset.locked === "1") {
      e.preventDefault();
      return;
    }
    dragChip = chip;
    e.dataTransfer?.setData("text/grip-chip-id", chip.dataset.gripChip ?? "");
    e.dataTransfer!.effectAllowed = "move";
  };

  const onDragOver = (e: DragEvent) => {
    if (!dragChip) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (!dragChip) return;

    const target = (e.target as HTMLElement).closest<HTMLElement>(`.${INLINE_CHIP_CLASS}`);
    if (target && target !== dragChip) {
      const parent = target.parentNode;
      if (parent) {
        parent.insertBefore(dragChip, target);
        ensureZwspAfterChip(dragChip);
        onReorder?.();
      }
    } else if (!target && editor.contains(e.target as Node)) {
      editor.appendChild(dragChip);
      ensureZwspAfterChip(dragChip);
      onReorder?.();
    }

    dragChip = null;
  };

  const onDragEnd = () => {
    dragChip = null;
  };

  editor.addEventListener("dragstart", onDragStart);
  editor.addEventListener("dragover", onDragOver);
  editor.addEventListener("drop", onDrop);
  editor.addEventListener("dragend", onDragEnd);

  return () => {
    editor.removeEventListener("dragstart", onDragStart);
    editor.removeEventListener("dragover", onDragOver);
    editor.removeEventListener("drop", onDrop);
    editor.removeEventListener("dragend", onDragEnd);
  };
}

function ensureZwspAfterChip(chip: HTMLElement): void {
  const next = chip.nextSibling;
  if (next?.nodeType === Node.TEXT_NODE && (next.textContent ?? "").includes(ZWSP)) return;
  chip.after(document.createTextNode(ZWSP));
}
