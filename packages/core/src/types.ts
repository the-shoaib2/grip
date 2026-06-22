export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface RefEntry {
  ref: string;
  backendNodeId: number;
  role?: string;
  name?: string;
  frameId?: string;
  inShadowDom?: boolean;
}

export interface A11ySnapshot {
  yaml: string;
  refs: Record<string, RefEntry>;
  title?: string;
  url?: string;
}

export interface SelectorResult {
  css: string;
  xpath: string;
  inShadowDom: boolean;
}

export type LogLevel = "log" | "warn" | "error" | "all";

export interface LogEntry {
  level: "log" | "warn" | "error" | "info" | "debug";
  message: string;
  stackTrace?: string;
  timestamp: number;
}

export interface HarEntry {
  requestId: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  mimeType?: string;
  startedDateTime: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

export interface CdpSession {
  send(method: string, params?: Record<string, unknown>): Promise<unknown>;
}
