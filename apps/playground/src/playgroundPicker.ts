import {
  describeElement,
  logPickedElementWithSource,
  type OpenContextEditorPayload,
  type PickerElementPayload,
} from "grip-dev";
import {
  createPicker,
  type PickerFeatures,
  type PickerHost,
} from "@grip/devtools-lib";
import { showTrayAfterHandoff, hideTrayForHandoff } from "./trayBridge";

let setPickerActiveFn: ((active: boolean) => void) | null = null;
let showTrayFn: ((options?: { restore?: boolean }) => void) | null = null;

export function wirePlaygroundPickerHost(opts: {
  setPickerActive: (active: boolean) => void;
  showTray?: (options?: { restore?: boolean }) => void;
}): void {
  setPickerActiveFn = opts.setPickerActive;
  showTrayFn = opts.showTray ?? null;
}

const playgroundFeatures: PickerFeatures = {
  panelDrag: false,
  pendingHighlights: false,
  composerPromptSnapshot: false,
  commentEscapeInComposerResumes: true,
};

export interface PlaygroundPickerOptions {
  onSave: (payload: PickerElementPayload) => void;
  onStop?: () => void;
}

let onSaveCallback: ((payload: PickerElementPayload) => void) | null = null;
let onStopCallback: (() => void) | null = null;

const host: PickerHost = {
  isContextValid: () => true,
  setPickerActive(active) {
    setPickerActiveFn?.(active);
  },
  hideTray() {
    hideTrayForHandoff();
  },
  sendPick(el, comment, options) {
    if (!onSaveCallback) return;
    const payload: PickerElementPayload = {
      ...describeElement(el),
      comment: comment.trim() || undefined,
      storedPickId: options?.storedPickId,
    };
    void logPickedElementWithSource(payload);
    onSaveCallback(payload);
  },
  updatePickComment() {},
  showTray(options) {
    if (showTrayFn) {
      showTrayFn(options);
      return;
    }
    showTrayAfterHandoff(Boolean(options?.restore));
  },
  onSessionEnd() {
    onStopCallback?.();
    onStopCallback = null;
    onSaveCallback = null;
  },
};

const picker = createPicker(host, playgroundFeatures);

export function startPlaygroundPicker(options: PlaygroundPickerOptions): void {
  stopPlaygroundPicker(false);
  onSaveCallback = options.onSave;
  onStopCallback = options.onStop ?? null;
  picker.start();
}

export function stopPlaygroundPicker(notify = true): void {
  picker.stop({ notify, restore: true });
  onSaveCallback = null;
  if (notify) {
    onStopCallback?.();
    onStopCallback = null;
  }
}

export function openPlaygroundContextEditor(
  payload: OpenContextEditorPayload,
  onSave: (pickId: string, comment: string) => void,
  onEnd?: () => void,
): void {
  picker.openContextEditor(payload, {
    onEditSave: onSave,
    onEditEnd: onEnd,
  });
}

export function isPlaygroundPickerActive(): boolean {
  return picker.isActive();
}
