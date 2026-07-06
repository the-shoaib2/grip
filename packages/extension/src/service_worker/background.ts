import type { GripMessage } from "grip-dev";
import { routeMessage } from "./messageRouter";
import { registerTabLifecycleListeners } from "./tabLifecycle";

if (typeof chrome !== "undefined" && chrome.storage?.session?.setAccessLevel) {
  void chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
  }).catch(() => {
    /* ignore if not supported in this context */
  });
}

chrome.runtime.onMessage.addListener((msg: GripMessage, sender, sendResponse) => {
  return routeMessage(msg, sender, sendResponse);
});

registerTabLifecycleListeners();
