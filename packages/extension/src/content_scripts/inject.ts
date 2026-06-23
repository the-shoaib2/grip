import { isExtensionContextValid } from "@/lib/runtime";
import "@/content_scripts/bootstrap-floating";
import "@/content_scripts/bootstrap-core";

export type BootstrapFeature = "picker" | "floating";

/** Bootstraps are loaded eagerly so content-script dynamic imports never break on page origins. */
export function ensureBootstrap(_feature: BootstrapFeature = "picker"): Promise<void> {
  return Promise.resolve();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!isExtensionContextValid()) return;

  if (msg.type === "GRIP_PING") {
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === "GRIP_BOOTSTRAP_PING") {
    const feature =
      (msg.payload as { feature?: BootstrapFeature } | undefined)?.feature ?? "picker";
    void ensureBootstrap(feature)
      .then(() => sendResponse({ ok: true }))
      .catch((err: Error) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  return false;
});

/** Called by CRXJS loader after this module is imported. */
export function onExecute(): void {}
