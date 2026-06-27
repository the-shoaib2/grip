import type { ElementRect } from "./a11y.js";
import type { FrameworkContext } from "./framework.js";

export type GripMessageType =
  | "START_PICKER"
  | "STOP_PICKER"
  | "PICKER_ELEMENT_SELECTED"
  | "NAVIGATE_TO_PICK"
  | "GET_PICK_HISTORY"
  | "LOG_ENTRY"
  | "NETWORK_ENTRY"
  | "PANEL_READY"
  | "TOGGLE_GRIP_TRAY"
  | "NEW_SESSION"
  | "SHOW_TRAY"
  | "HIDE_TRAY"
  | "UPDATE_PICK_COMMENT"
  | "OPEN_CONTEXT_EDITOR"
  | "DELETE_PICK"
  | "SET_ACTIVE_SESSION"
  | "DELETE_SESSION"
  | "GRIP_PING"
  | "GRIP_BOOTSTRAP_PING"
  | "GRIP_BOOTSTRAP_ERROR"
  | "REGISTER_SESSION_CONTEXT"
  | "PATCH_APPLIED"
  | "PATCH_FAILED";

export interface PickerElementPayload {
  tagName: string;
  css: string;
  xpath: string;
  role: string;
  name: string;
  rect: ElementRect;
  shadowDOM: boolean;
  iframe: string;
  innerText: string;
  /** User context note — included in MCP prompt for the agent. */
  comment?: string;
  /** When saving, use this id instead of generating a new one (multi-pick sessions). */
  storedPickId?: string;
  /** Dev-build framework source hint (React Fiber, Vue __file, etc.). */
  frameworkContext?: FrameworkContext | null;
}

/** Sent with START_PICKER so the content script knows the active chat session. */
export interface PickerStartPayload {
  sessionId: string;
  sessionPickCount: number;
}

export interface StoredPick extends PickerElementPayload {
  id: string;
  /** Groups picks saved during one chat session on a page. */
  sessionId: string;
  url: string;
  pageTitle: string;
  timestamp: number;
  label: string;
}

/** Optional payload for SHOW_TRAY — restore only reopens if the tray was open before handoff. */
export interface ShowTrayPayload {
  restore?: boolean;
}

/** Open the page-level picker context panel to edit an existing pick. */
export interface OpenContextEditorPayload {
  pick: StoredPick;
  pickIndex?: number;
  pickCount?: number;
  /** Session picks for resolving multi-badge chip tokens. */
  sessionPicks?: StoredPick[];
}

export interface GripMessage<T = unknown> {
  type: GripMessageType;
  payload?: T;
  /** Target browser tab (DevTools / explicit routing). */
  tabId?: number;
}

export interface LogMessagePayload {
  level: string;
  message: string;
  timestamp: number;
}

export interface NetworkMessagePayload {
  url: string;
  method: string;
  status?: number;
}

/** Register picks for MCP session handshake (host-side mirror). */
export interface RegisterSessionContextPayload {
  sessionId: string;
  picks: StoredPick[];
}

export interface PatchAppliedPayload {
  filePath: string;
  startLine: number;
  endLine: number;
  summary?: string;
}

export interface PatchFailedPayload {
  filePath: string;
  error: string;
}

export type { FrameworkContext } from "./framework.js";
