export type GripMessageType =
  | "PICKER_ELEMENT_SELECTED"
  | "LOG_ENTRY"
  | "NETWORK_ENTRY"
  | "PANEL_READY";

export interface PickerElementPayload {
  css: string;
  xpath: string;
  role: string;
  name: string;
  rect: { top: number; left: number; width: number; height: number };
  shadowDOM: boolean;
  iframe: string;
  innerText: string;
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
