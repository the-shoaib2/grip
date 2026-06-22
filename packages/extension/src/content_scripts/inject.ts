import "@/content_scripts/picker";
import "@/content_scripts/tray";
import "@/content_scripts/log-injector";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GRIP_PING") {
    sendResponse({ ok: true });
    return true;
  }
});
