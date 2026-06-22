import { chromeRuntime, mountFloatingGrip, TRAY_ID } from "@grip/devtools-floating";
import { navigateToSelector } from "@/content_scripts/navigator";

export { TRAY_ID };

const controller = mountFloatingGrip(chromeRuntime);

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
  if (msg.type === "SHOW_TRAY") {
    controller.setOpen(true);
    sendResponse({ ok: true });
    return true;
  }
});
