import type { GripMessage } from "@grip/core";
import { routeMessage } from "./messageRouter";
import { registerTabLifecycleListeners } from "./tabLifecycle";

chrome.runtime.onMessage.addListener((msg: GripMessage, sender, sendResponse) => {
  return routeMessage(msg, sender, sendResponse);
});

registerTabLifecycleListeners();
