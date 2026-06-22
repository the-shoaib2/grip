let ready = false;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GRIP_PING") {
    sendResponse({ ok: ready });
    return true;
  }
});

void import("@/content_scripts/bootstrap")
  .then(() => {
    ready = true;
  })
  .catch((err) => {
    console.error("[Grip] bootstrap failed", err);
  });

/** Called by CRXJS loader after this module is imported. */
export function onExecute(): void {}
