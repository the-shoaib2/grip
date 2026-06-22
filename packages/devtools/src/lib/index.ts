export { gripUserError } from "./errors";
export {
  bindChipTooltipRoot,
  bindTrayBadgeTooltips,
  hideChipTooltip,
  type ChipTooltipMeta,
} from "./chipTooltip";
export {
  chipMetaFromElement,
  createChipElement,
  createDefaultChip,
  bindEditorClipboard,
  focusEditor,
  handleEditorKeydown,
  INLINE_CHIP_CLASS,
  INLINE_EDITOR_CLASS,
  insertChipAtSelection,
  isEditorEmpty,
  placeCaretAtEnd,
  removeChipElement,
  findChipElement,
  selectChipElement,
  serializeEditor,
  serializeSelectionForClipboard,
  setEditorFromComment,
  updateChipActiveStates,
  type InlineChipRef,
} from "./inlineComposerDom";
