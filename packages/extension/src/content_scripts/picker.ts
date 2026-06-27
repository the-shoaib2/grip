import type { OpenContextEditorPayload, PickerStartPayload } from "@grip/core";
import { describeElement, logPickedElement } from "@grip/core";
import {
  createPicker,
  type PickerFeatures,
  type PickerHost,
} from "@grip/devtools-lib";
import { isExtensionContextValid, safeSendMessage } from "@/lib";
import { showFloatingTray, hideFloatingTray } from "@/content_scripts/tray-control";

const extensionFeatures: PickerFeatures = {
  panelDrag: true,
  pendingHighlights: true,
  composerPromptSnapshot: true,
  commentEscapeInComposerResumes: false,
};

const host: PickerHost = {
  isContextValid: isExtensionContextValid,
  setPickerActive(active) {
    void chrome.storage.session.set({ pickerActive: active });
  },
  sendPick(el, comment, options) {
    const payload = {
      ...describeElement(el),
      comment: comment.trim() || undefined,
      storedPickId: options?.storedPickId,
    };
    logPickedElement(payload);
    safeSendMessage({ type: "PICKER_ELEMENT_SELECTED", payload });
  },
  updatePickComment(pickId, comment) {
    safeSendMessage({
      type: "UPDATE_PICK_COMMENT",
      payload: { pickId, comment },
    });
  },
  showTray(options) {
    showFloatingTray(options);
    safeSendMessage({ type: "SHOW_TRAY", payload: options });
  },
  hideTray() {
    hideFloatingTray();
    safeSendMessage({ type: "HIDE_TRAY" });
  },
};

const picker = createPicker(host, extensionFeatures);

function startPicker(payload?: PickerStartPayload): void {
  picker.start({ sessionPickCount: payload?.sessionPickCount });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!isExtensionContextValid()) {
    picker.cleanup();
    return;
  }
  if (msg.type === "START_PICKER") {
    startPicker(msg.payload as PickerStartPayload | undefined);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "STOP_PICKER") {
    picker.stop({ restore: true });
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "OPEN_CONTEXT_EDITOR") {
    picker.openContextEditor(msg.payload as OpenContextEditorPayload);
    sendResponse({ ok: true });
    return true;
  }
});

/** Drop stale picker-active UI state when the content script reloads mid-session. */
void chrome.storage.session.get("pickerActive").then((data) => {
  if (data.pickerActive && !picker.isActive()) {
    void chrome.storage.session.set({ pickerActive: false });
  }
});
