export { gripUserError } from "./errors";
export {
  ensureTabReady,
  injectGripScripts,
  pingTab,
  REFRESH_HINT,
  sendToTab,
  sendToTabWhenReady,
  waitForGrip,
} from "./tab-bridge";
export { isExtensionContextValid, safeSendMessage } from "./runtime";
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
