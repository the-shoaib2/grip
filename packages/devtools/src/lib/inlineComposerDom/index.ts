export {
  INLINE_CHIP_CLASS,
  INLINE_CHIP_GROUP_CLASS,
  INLINE_EDITOR_CLASS,
  chipLabelText,
  chipMetaFromElement,
  createChipElement,
  createChipGroupElement,
  createDefaultChip,
  findChipElement,
  listChipElements,
  removeChipElement,
  toInlineChipRef,
  updateChipActiveStates,
  updateChipElement,
  updateChipSelectedStates,
  type InlineChipRef,
} from "@/lib/inlineComposerDom/chips";
export { DEFAULT_BADGE_MENU_ITEMS, hideBadgeMenu, showBadgeMenu } from "@/lib/inlineComposerDom/badgeMenu";
export { bindBadgeEditor, insertBadgeAtCursor, serializeEditorWithRegistry } from "@/lib/inlineComposerDom/badgeEditor";
export { bindChipDragDrop } from "@/lib/inlineComposerDom/dragDrop";
export { ChipMultiSelect } from "@/lib/inlineComposerDom/multiSelect";
export {
  bindEditorClipboard,
  serializeSelectionForClipboard,
} from "@/lib/inlineComposerDom/clipboard";
export {
  deleteSelectionInEditor,
  handleEditorKeydown,
  isPrimaryMod,
  isPrimaryModShortcut,
} from "@/lib/inlineComposerDom/keyboard";
export {
  chipAdjacentToCaret,
  focusEditor,
  insertChipAtSelection,
  placeCaretAfter,
  placeCaretAtEnd,
  selectAllInEditor,
  selectChipElement,
  serializeEditorSelection,
  type FocusEditorCaret,
  type FocusEditorOptions,
} from "@/lib/inlineComposerDom/selection";
export {
  isEditorEmpty,
  serializeEditor,
  setEditorFromComment,
  type SetEditorFromCommentOptions,
} from "@/lib/inlineComposerDom/serialize";
