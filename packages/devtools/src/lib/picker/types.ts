import type { OpenContextEditorPayload } from "@grip/core";

export type PickerPhase = "idle" | "hover" | "context" | "edit";

export interface PendingPick {
  chipId: string;
  el: Element;
  css: string;
  tag: string;
  role: string;
  text: string;
  name: string;
  xpath: string;
  rect: { top: number; left: number; width: number; height: number };
  shadowDOM: boolean;
  iframe: string;
}

export interface PickerHost {
  isContextValid(): boolean;
  setPickerActive(active: boolean): void;
  sendPick(el: Element, comment: string): void;
  updatePickComment(pickId: string, comment: string | undefined): void;
  showTray(options?: { restore?: boolean }): void;
  /** Called when a pick session ends after save (not on explicit stop/cleanup). */
  onSessionEnd?(): void;
}

export interface PickerFeatures {
  panelDrag: boolean;
  pendingHighlights: boolean;
  composerPromptSnapshot: boolean;
  /** Playground: Escape in composer resumes hover; extension: Escape outside composer resumes hover. */
  commentEscapeInComposerResumes: boolean;
}

export interface PickerStartOptions {
  sessionPickCount?: number;
}

export interface OpenContextEditorOptions {
  onEditSave?: (pickId: string, comment: string) => void;
  onEditEnd?: () => void;
}

export interface PickerStopOptions {
  restore?: boolean;
  notify?: boolean;
}

export interface Picker {
  start(options?: PickerStartOptions): void;
  stop(options?: PickerStopOptions): void;
  cleanup(): void;
  openContextEditor(
    payload: OpenContextEditorPayload,
    options?: OpenContextEditorOptions,
  ): void;
  isActive(): boolean;
}
