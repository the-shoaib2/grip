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
  focusEditor,
  handleEditorKeydown,
  INLINE_CHIP_CLASS,
  INLINE_EDITOR_CLASS,
  insertChipAtSelection,
  isEditorEmpty,
  placeCaretAtEnd,
  removeChipElement,
  findChipElement,
  serializeEditor,
  setEditorFromComment,
  updateChipActiveStates,
  type InlineChipRef,
} from "./inlineComposerDom";
