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
  | "GRIP_PING";

export interface PickerElementPayload {
  tagName: string;
  css: string;
  xpath: string;
  role: string;
  name: string;
  rect: { top: number; left: number; width: number; height: number };
  shadowDOM: boolean;
  iframe: string;
  innerText: string;
  /** User context note — included in MCP prompt for the agent. */
  comment?: string;
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

export interface GripMessage<T = unknown> {
  type: GripMessageType;
  payload: T;
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
