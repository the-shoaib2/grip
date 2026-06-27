import type { GripMessage } from "@grip/core";
import {
  handleDeletePick,
  handleGetPickHistory,
  handleNavigateToPick,
  handleUpdatePickComment,
} from "./handlers/historyHandlers";
import {
  handleGripBootstrapError,
  handleGripPing,
  handleHideTray,
  handleLogEntry,
  handleOpenContextEditor,
  handlePanelReady,
  handleShowTray,
  handleToggleGripTray,
} from "./handlers/panelHandlers";
import {
  handlePickerElementSelected,
  handleStartPicker,
  handleStopPicker,
} from "./handlers/pickerHandlers";
import {
  handleDeleteSession,
  handleNewSession,
  handleSetActiveSession,
} from "./handlers/sessionHandlers";
import {
  handlePatchApplied,
  handlePatchFailed,
  handleRegisterSessionContext,
} from "./handlers/contextHandlers";

export function routeMessage(
  msg: GripMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean | undefined {
  switch (msg.type) {
    case "START_PICKER":
      return handleStartPicker(msg, sender, sendResponse);
    case "STOP_PICKER":
      return handleStopPicker(msg, sender, sendResponse);
    case "PICKER_ELEMENT_SELECTED":
      return handlePickerElementSelected(msg, sender, sendResponse);
    case "NAVIGATE_TO_PICK":
      return handleNavigateToPick(msg, sender, sendResponse);
    case "GET_PICK_HISTORY":
      return handleGetPickHistory(msg, sender, sendResponse);
    case "TOGGLE_GRIP_TRAY":
      return handleToggleGripTray(msg, sender, sendResponse);
    case "SHOW_TRAY":
      return handleShowTray(msg, sender, sendResponse);
    case "HIDE_TRAY":
      return handleHideTray(msg, sender, sendResponse);
    case "NEW_SESSION":
      return handleNewSession(msg, sender, sendResponse);
    case "OPEN_CONTEXT_EDITOR":
      return handleOpenContextEditor(msg, sender, sendResponse);
    case "UPDATE_PICK_COMMENT":
      return handleUpdatePickComment(msg, sender, sendResponse);
    case "DELETE_PICK":
      return handleDeletePick(msg, sender, sendResponse);
    case "SET_ACTIVE_SESSION":
      return handleSetActiveSession(msg, sender, sendResponse);
    case "DELETE_SESSION":
      return handleDeleteSession(msg, sender, sendResponse);
    case "LOG_ENTRY":
      return handleLogEntry(msg, sender, sendResponse);
    case "PANEL_READY":
      return handlePanelReady(msg, sender, sendResponse);
    case "GRIP_PING":
      return handleGripPing(msg, sender, sendResponse);
    case "GRIP_BOOTSTRAP_ERROR":
      return handleGripBootstrapError(msg, sender, sendResponse);
    case "REGISTER_SESSION_CONTEXT":
      return handleRegisterSessionContext(msg, sender, sendResponse);
    case "PATCH_APPLIED":
      return handlePatchApplied(msg, sender, sendResponse);
    case "PATCH_FAILED":
      return handlePatchFailed(msg, sender, sendResponse);
    default:
      return undefined;
  }
}
