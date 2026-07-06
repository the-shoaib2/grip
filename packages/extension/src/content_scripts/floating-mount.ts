import { chromeRuntime, mountFloatingGrip, TRAY_ID } from "@grip/devtools-floating";
import type { ShowTrayPayload } from "grip-dev";
import { navigateToSelector } from "@/content_scripts/navigator";
import {
  hideFloatingTray,
  registerFloatingController,
  showFloatingTray,
} from "@/content_scripts/tray-control";

export { TRAY_ID };

const controller = mountFloatingGrip(chromeRuntime);
registerFloatingController(controller);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "TOGGLE_GRIP_TRAY") {
    controller.toggle();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "NAVIGATE_TO_PICK" && msg.payload?.css) {
    navigateToSelector(msg.payload.css);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "HIDE_TRAY") {
    hideFloatingTray();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "SHOW_TRAY") {
    const payload = msg.payload as ShowTrayPayload | undefined;
    showFloatingTray({ restore: Boolean(payload?.restore) });
    sendResponse({ ok: true });
    return true;
  }
});
