import {
  ContextBadgeRegistry,
  duplicateBadge,
  GRIP_CHIP_TOKEN_RE,
  newChipId,
  parseInlineComment,
} from "@grip/core";
import {
  badgeFromChipRef,
  chipRefFromBadge,
  executeBadgeAction,
  formatBadgeClipboardJson,
  parseBadgeClipboardJson,
  type BadgeAction,
} from "@devtools/lib/contextBadge";
import { DEFAULT_BADGE_MENU_ITEMS, hideBadgeMenu, showBadgeMenu } from "@devtools/lib/inlineComposerDom/badgeMenu";
import {
  chipMetaFromElement,
  findChipElement,
  INLINE_CHIP_CLASS,
  type InlineChipRef,
  removeChipElement,
  updateChipElement,
  ZWSP,
} from "@devtools/lib/inlineComposerDom/chips";
import { bindChipDragDrop } from "@devtools/lib/inlineComposerDom/dragDrop";
import { ChipMultiSelect } from "@devtools/lib/inlineComposerDom/multiSelect";
import { insertChipAtSelection } from "@devtools/lib/inlineComposerDom/selection";
import { serializeEditor } from "@devtools/lib/inlineComposerDom/serialize";

export interface BindBadgeEditorOptions {
  registry?: ContextBadgeRegistry;
  onChange?: () => void;
  onChipRemoved?: (chipId: string) => void;
  onReplaceRequest?: (badgeId: string) => void;
  onJumpToSource?: (badge: ReturnType<ContextBadgeRegistry["get"]>) => void;
  readOnly?: boolean;
}

export function bindBadgeEditor(
  editor: HTMLElement,
  options: BindBadgeEditorOptions = {},
): () => void {
  const registry = options.registry ?? new ContextBadgeRegistry();
  const multi = new ChipMultiSelect(editor);
  const cleanups: Array<() => void> = [];

  const notify = () => {
    options.onChange?.();
  };

  const syncRegistryFromDom = () => {
    editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`).forEach((chip) => {
      const meta = chipMetaFromElement(chip);
      if (meta) registry.set(badgeFromChipRef(meta, registry));
    });
  };

  const refreshChipDom = (chipId: string) => {
    const badge = registry.get(chipId);
    const chip = findChipElement(editor, chipId);
    if (!badge || !chip) return;
    updateChipElement(chip, chipRefFromBadge(badge));
  };

  const runAction = (action: BadgeAction, badgeId: string) => {
    const selected = multi.ids.length ? multi.ids : [badgeId];

    if (action === "duplicate") {
      for (const id of selected) {
        const badge = registry.get(id);
        if (!badge) continue;
        const dup = duplicateBadge(badge, newChipId());
        registry.set(dup);
        insertChipAtSelection(editor, chipRefFromBadge(dup), false);
      }
      notify();
      return;
    }

    executeBadgeAction(action, badgeId, {
      registry,
      onRegistryChange: () => {
        if (action === "remove") {
          const chip = findChipElement(editor, badgeId);
          if (chip) removeChipElement(chip);
          options.onChipRemoved?.(badgeId);
        } else {
          for (const id of multi.ids.length ? multi.ids : [badgeId]) refreshChipDom(id);
        }
        notify();
      },
      onReplaceRequest: options.onReplaceRequest,
      onJumpToSource: (b) => options.onJumpToSource?.(b),
    }, { selectedIds: multi.ids });
  };

  if (!options.readOnly) {
    cleanups.push(bindChipDragDrop(editor, notify));

    const onContextMenu = (e: MouseEvent) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>(`.${INLINE_CHIP_CLASS}`);
      if (!chip || !editor.contains(chip)) return;
      e.preventDefault();
      const chipId = chip.dataset.gripChip;
      if (!chipId) return;
      if (!multi.ids.includes(chipId)) multi.selectOnly(chipId);

      showBadgeMenu({
        x: e.clientX,
        y: e.clientY,
        items: DEFAULT_BADGE_MENU_ITEMS,
        onSelect: (itemId) => runAction(itemId as BadgeAction, chipId),
      });
    };

    const onChipClick = (e: MouseEvent) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>(`.${INLINE_CHIP_CLASS}`);
      if (!chip || !editor.contains(chip)) return;
      const chipId = chip.dataset.gripChip;
      if (!chipId) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        e.preventDefault();
        multi.handleChipClick(chipId, e);
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text) return;

      const jsonBadge = parseBadgeClipboardJson(text);
      if (jsonBadge) {
        e.preventDefault();
        registry.set(jsonBadge);
        insertChipAtSelection(editor, chipRefFromBadge(jsonBadge), true);
        notify();
        return;
      }

      if (GRIP_CHIP_TOKEN_RE.test(text)) {
        e.preventDefault();
        const parts = parseInlineComment(text);
        for (const part of parts) {
          if (part.type === "chip") {
            const existing = registry.get(part.id);
            if (existing) {
              insertChipAtSelection(editor, chipRefFromBadge(existing), false);
            }
            continue;
          }
          if (part.value) {
            document.execCommand("insertText", false, part.value);
          }
        }
        notify();
      }
    };

    const onCopyBadge = (e: ClipboardEvent) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>(`.${INLINE_CHIP_CLASS}`);
      if (!chip || !editor.contains(chip)) return;
      const meta = chipMetaFromElement(chip);
      if (!meta) return;
      const badge = badgeFromChipRef(meta, registry);
      if (!multi.ids.includes(meta.id)) {
        e.preventDefault();
        e.clipboardData?.setData("text/plain", formatBadgeClipboardJson(badge));
      }
    };

    editor.addEventListener("contextmenu", onContextMenu);
    editor.addEventListener("click", onChipClick);
    editor.addEventListener("paste", onPaste);
    editor.addEventListener("copy", onCopyBadge);

    cleanups.push(() => {
      editor.removeEventListener("contextmenu", onContextMenu);
      editor.removeEventListener("click", onChipClick);
      editor.removeEventListener("paste", onPaste);
      editor.removeEventListener("copy", onCopyBadge);
      hideBadgeMenu();
      multi.clear();
    });
  }

  syncRegistryFromDom();

  return () => {
    for (const fn of cleanups) fn();
  };
}

export function insertBadgeAtCursor(
  editor: HTMLElement,
  meta: InlineChipRef,
  registry: ContextBadgeRegistry,
): void {
  registry.set(badgeFromChipRef(meta, registry));
  insertChipAtSelection(editor, meta, true);
}

export function serializeEditorWithRegistry(
  editor: HTMLElement,
  registry: ContextBadgeRegistry,
): { comment: string; chips: InlineChipRef[] } {
  syncRegistryToDom(editor, registry);
  return {
    comment: serializeEditor(editor),
    chips: registry.toChipRefs() as InlineChipRef[],
  };
}

function syncRegistryToDom(editor: HTMLElement, registry: ContextBadgeRegistry): void {
  editor.querySelectorAll<HTMLElement>(`.${INLINE_CHIP_CLASS}`).forEach((chip) => {
    const meta = chipMetaFromElement(chip);
    if (meta) registry.set(badgeFromChipRef(meta, registry));
  });
}
