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
  time?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

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

export interface SnapshotResult {
  yaml: string;
  refs: Record<string, RefEntry>;
  title: string;
  url: string;
}

export interface PickElementResult {
  ref: string;
  cssSelector: string;
  xpathSelector: string;
  role: string;
  name: string;
  rect: ElementRect;
  shadowDOM: boolean;
  iframe: string;
}

export interface GripConfig {
  port: number;
  logLevel: string;
}
