import { INLINE_CHIP_CLASS, updateChipSelectedStates } from "@/lib/inlineComposerDom/chips";

export class ChipMultiSelect {
  private selected = new Set<string>();
  private anchorId: string | null = null;

  constructor(private editor: HTMLElement) {}

  get ids(): string[] {
    return [...this.selected];
  }

  clear(): void {
    this.selected.clear();
    this.anchorId = null;
    updateChipSelectedStates(this.editor, this.selected);
  }

  selectOnly(chipId: string): void {
    this.selected.clear();
    this.selected.add(chipId);
    this.anchorId = chipId;
    updateChipSelectedStates(this.editor, this.selected);
  }

  toggle(chipId: string): void {
    if (this.selected.has(chipId)) this.selected.delete(chipId);
    else this.selected.add(chipId);
    this.anchorId = chipId;
    updateChipSelectedStates(this.editor, this.selected);
  }

  selectRange(toChipId: string): void {
    const chips = Array.from(this.editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`));
    const ids = chips.map((c) => c.dataset.gripChip).filter(Boolean) as string[];
    const from = this.anchorId ?? toChipId;
    const a = ids.indexOf(from);
    const b = ids.indexOf(toChipId);
    if (a < 0 || b < 0) {
      this.selectOnly(toChipId);
      return;
    }
    const [start, end] = a < b ? [a, b] : [b, a];
    this.selected.clear();
    for (let i = start; i <= end; i++) this.selected.add(ids[i]!);
    updateChipSelectedStates(this.editor, this.selected);
  }

  handleChipClick(chipId: string, e: MouseEvent): void {
    if (e.shiftKey && this.anchorId) {
      this.selectRange(chipId);
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      this.toggle(chipId);
      this.anchorId = chipId;
      return;
    }
    this.selectOnly(chipId);
  }
}
