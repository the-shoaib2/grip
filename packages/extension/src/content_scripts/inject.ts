import { isExtensionContextValid, safeSendMessage } from "@/lib/runtime";

export type BootstrapFeature = "picker" | "floating";

let corePromise: Promise<void> | null = null;
let floatingPromise: Promise<void> | null = null;

function reportBootstrapError(err: unknown, feature: BootstrapFeature): never {
  const message = err instanceof Error ? err.message : String(err);
  if (isExtensionContextValid()) {
    safeSendMessage({
      type: "GRIP_BOOTSTRAP_ERROR",
      payload: { feature, message },
    });
  }
  throw err instanceof Error ? err : new Error(message);
}

export function ensureBootstrap(feature: BootstrapFeature = "picker"): Promise<void> {
  if (feature === "floating") {
    if (!floatingPromise) {
      floatingPromise = import("@/content_scripts/bootstrap-floating")
        .then(() => undefined)
        .catch((err) => reportBootstrapError(err, feature));
    }
    return floatingPromise;
  }

  if (!corePromise) {
    corePromise = import("@/content_scripts/bootstrap-core")
      .then(() => undefined)
      .catch((err) => reportBootstrapError(err, feature));
  }
  return corePromise;
}

function prefetchFloating(): void {
  setTimeout(() => {
    void ensureBootstrap("floating");
  }, 0);
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

void ensureBootstrap("picker");
void ensureBootstrap("floating");

/** Called by CRXJS loader after this module is imported. */
export function onExecute(): void {}
