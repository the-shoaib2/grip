export { GRIP_ERROR, gripUserError, type GripErrorCode } from "./errors.js";
export { createRefMap, RefMap } from "./ref-map.js";
export {
  deepElementFromPoint,
  describeElement,
  elementFromComposedEvent,
  elementsAtPoint,
  generateSelector,
  generateXPath,
  pickTargetAtPoint,
} from "./selector.js";
export {
  appendSessionToOrder,
  dedupeSessionOrder,
  mergeSessionOrder,
  nextSessionIdAfterDelete,
  reconcileSessionOrderAfterPickDelete,
  removeSessionFromOrder,
} from "./session-handlers/index.js";
export {
  appendPickHistory,
  clearPicksForSession,
  clearPicksForUrl,
  newSessionId,
  pickLabel,
  picksForSession,
  picksForUrl,
  groupPicksBySession,
  type SessionPickGroup,
  lastPickInSession,
  toStoredPick,
  updatePickInHistory,
  removePickFromHistory,
} from "./pick-history.js";
export {
  composerStateForStoredPick,
  formatPickIndexLabel,
  storedPickChipsToInlineRefs,
  storedPickToChipRef,
  type StoredPickChipRef,
} from "./stored-pick-composer.js";
export { buildSnapshot, buildSnapshotForLLM } from "./snapshot.js";
export { serializeForLLM, serializeSnapshotJson } from "./serializer.js";
export {
  checkChromeDebugPort,
  formatAllMcpPrompts,
  formatMcpPrompt,
  GRIP_MCP_DEFAULT_PORT,
} from "./mcp-prompt.js";
export { GRIP_MCP_DOCS_URL } from "./mcp-docs.js";
export {
  chipDisplayLabel,
  formatChipForClipboard,
  formatInlineCommentForMcp,
  gripChipToken,
  GRIP_CHIP_TOKEN_RE,
  newChipId,
  parseInlineComment,
  serializeInlineComment,
} from "./inline-composer.js";
export type { ChipClipboardMeta } from "./inline-composer.js";
export type { PickerElementDetails } from "./mcp-prompt.js";
export type {
  A11ySnapshot,
  CdpSession,
  ElementRect,
  HarEntry,
  LogEntry,
  LogLevel,
  RefEntry,
  SelectorResult,
} from "./types/a11y.js";
export type {
  GripMessage,
  GripMessageType,
  LogMessagePayload,
  NetworkMessagePayload,
  OpenContextEditorPayload,
  PickerElementPayload,
  PickerStartPayload,
  PatchAppliedPayload,
  PatchFailedPayload,
  RegisterSessionContextPayload,
  ShowTrayPayload,
  StoredPick,
  FrameworkContext,
} from "./types/messages.js";
export { applyPatch, type PatchOptions } from "./patch-engine.js";
export {
  buildContextBlockFromPick,
  buildContextBlocksFromSession,
  canBuildContextBlock,
  componentNameFromPick,
  enrichContextBlock,
  formatAllContextEnginePrompts,
  formatContextEnginePrompt,
  formatEnrichedContextEnginePrompt,
  formatPickPrompt,
  formatSendToAgentPrompt,
  parseInstructions,
  type BuildContextBlockOptions,
  type ContextBlock,
  type ContextBlockFramework,
} from "./context-block.js";
export {
  badgeDisplayLabel,
  badgeStateIndicator,
  chipRefToContextBadge,
  computeSourceHash,
  contextBadgeToChipRef,
  ContextBadgeRegistry,
  duplicateBadge,
  gripGroupToken,
  GRIP_GROUP_END_TOKEN,
  GRIP_GROUP_TOKEN_RE,
  markBadgeOutdatedIfHashChanged,
  mergeBadgeRefresh,
  type ContextBadge,
  type ContextBadgeGroup,
  type ContextBadgeState,
  type ContextInstructionBlock,
  type GripDocument,
} from "./context-badge.js";
export {
  isBlockedPatchPath,
  parseContextEnginePatches,
  validateContextEnginePatch,
  type ContextEnginePatch,
  type ContextEnginePatchBody,
  type PatchValidationResult,
  type ValidatePatchOptions,
} from "./patch-validator.js";
export {
  clearSessionContext,
  getSessionContext,
  listSessionContexts,
  loadSessionContextFromDisk,
  persistSessionContext,
  registerSessionContext,
  type SessionContextRecord,
} from "./session-registry.js";
export { applyContextEnginePatch, type ApplyContextEnginePatchResult } from "./apply-context-patch.js";
export {
  clearAppliedPatchHistory,
  getAppliedPatchHistory,
  recordAppliedPatch,
  type AppliedPatchRecord,
} from "./patch-history.js";
export {
  expandLineRange,
  normalizeSourcePath,
  readSourceSnippet,
  resolveSourcePath,
  type ReadSourceSnippetOptions,
  type SourceSnippetResult,
} from "./source-mapper/index.js";