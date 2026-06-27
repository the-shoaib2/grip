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
} from "@devtools/lib/inlineComposerDom/chips";
export { DEFAULT_BADGE_MENU_ITEMS, hideBadgeMenu, showBadgeMenu } from "@devtools/lib/inlineComposerDom/badgeMenu";
export { bindBadgeEditor, insertBadgeAtCursor, serializeEditorWithRegistry } from "@devtools/lib/inlineComposerDom/badgeEditor";
export { bindChipDragDrop } from "@devtools/lib/inlineComposerDom/dragDrop";
export { ChipMultiSelect } from "@devtools/lib/inlineComposerDom/multiSelect";
export {
  bindEditorClipboard,
  serializeSelectionForClipboard,
} from "@devtools/lib/inlineComposerDom/clipboard";
export {
  deleteSelectionInEditor,
  handleEditorKeydown,
  isPrimaryMod,
  isPrimaryModShortcut,
} from "@devtools/lib/inlineComposerDom/keyboard";
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
} from "@devtools/lib/inlineComposerDom/selection";
export {
  isEditorEmpty,
  serializeEditor,
  setEditorFromComment,
  type SetEditorFromCommentOptions,
} from "@devtools/lib/inlineComposerDom/serialize";
