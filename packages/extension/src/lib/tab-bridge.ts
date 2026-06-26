import { GRIP_ERROR } from "./errors";
import type { BootstrapFeature } from "./types";

export type { BootstrapFeature } from "./types";

function isMissingResponseError(message: string): boolean {
  return message.toLowerCase().includes("message port closed");
}

function isNoReceiverError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("receiving end does not exist") ||
    lower.includes("could not establish connection")
  );
}

function isRestrictedPageError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("cannot access a chrome://") ||
    lower.includes("cannot access contents of url") ||
    lower.includes("extensions gallery") ||
    lower.includes("chrome web store")
  );
}

export function getInjectLoaderFile(): string | undefined {
  return chrome.runtime.getManifest().content_scripts?.[0]?.js?.[0];
}

export function getInjectModulePath(): string | undefined {
  const entries = chrome.runtime.getManifest().web_accessible_resources ?? [];
  const resources = entries.flatMap((entry) =>
    typeof entry === "object" ? entry.resources : [],
  );
  return resources.find(
    (resource) => resource.includes("inject.ts-") && !resource.includes("loader"),
  );
}

export function pingTab(tabId: number, frameId = 0): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "GRIP_PING" }, { frameId }, (response) => {
      const err = chrome.runtime.lastError;
      if (!err && (response as { ok?: boolean })?.ok) resolve(true);
      else resolve(false);
    });
  });
}

export async function waitForGrip(
  tabId: number,
  maxAttempts = 50,
  intervalMs = 100,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await pingTab(tabId)) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

export function sendToTabWithResponse<T>(
  tabId: number,
  message: unknown,
  frameId = 0,
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, { frameId }, (response: T) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message ?? "Tab message failed"));
        return;
      }
      resolve(response);
    });
  });
}

export function sendToTab(tabId: number, message: unknown, frameId = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, { frameId }, () => {
      const err = chrome.runtime.lastError;
      if (!err) {
        resolve();
        return;
      }
      const messageText = err.message ?? "";
      if (isMissingResponseError(messageText)) {
        resolve();
        return;
      }
      reject(new Error(messageText));
    });
  });
}

async function injectModule(tabId: number, modulePath: string): Promise<void> {
  const moduleUrl = chrome.runtime.getURL(modulePath);
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    world: "ISOLATED",
    func: async (url: string) => {
      await import(/* @vite-ignore */ url);
    },
    args: [moduleUrl],
  });
}

async function injectLoader(tabId: number, loaderFile: string): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    files: [loaderFile],
  });
}

function classifyInjectionError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (isRestrictedPageError(message)) {
    return new Error(GRIP_ERROR.PAGE_RESTRICTED);
  }
  if (isNoReceiverError(message)) {
    return new Error(GRIP_ERROR.EXTENSION_RELOADED);
  }
  return err instanceof Error ? err : new Error(message);
}

export async function injectGripScripts(tabId: number): Promise<void> {
  const modulePath = getInjectModulePath();
  const loaderFile = getInjectLoaderFile();

  if (modulePath) {
    try {
      await injectModule(tabId, modulePath);
      if (await pingTab(tabId)) return;
      if (await waitForGrip(tabId, 25, 100)) return;
    } catch (err) {
      const classified = classifyInjectionError(err);
      if (classified.message === GRIP_ERROR.PAGE_RESTRICTED) throw classified;
      /* fall through to loader */
    }
  }

  if (!loaderFile) throw new Error(GRIP_ERROR.SHELL_UNAVAILABLE);

  try {
    await injectLoader(tabId, loaderFile);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (isRestrictedPageError(message)) {
      throw new Error(GRIP_ERROR.PAGE_RESTRICTED);
    }
    if (!isNoReceiverError(message) && !message.toLowerCase().includes("already")) {
      throw classifyInjectionError(err);
    }
  }

  if (!(await waitForGrip(tabId))) {
    throw new Error(GRIP_ERROR.SHELL_UNAVAILABLE);
  }
}

export async function ensureTabReady(tabId: number): Promise<void> {
  if (await pingTab(tabId)) return;
  await injectGripScripts(tabId);
  if (!(await pingTab(tabId))) {
    throw new Error(GRIP_ERROR.SHELL_UNAVAILABLE);
  }
}

export async function waitForBootstrap(
  tabId: number,
  feature: BootstrapFeature = "picker",
  maxAttempts = 150,
  intervalMs = 100,
): Promise<void> {
  let lastError = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await sendToTabWithResponse<{ ok?: boolean; error?: string }>(tabId, {
        type: "GRIP_BOOTSTRAP_PING",
        payload: { feature },
      });
      if (response?.ok) return;
      lastError = response?.error ?? GRIP_ERROR.BOOTSTRAP_FAILED;
      throw new Error(`${GRIP_ERROR.BOOTSTRAP_FAILED}: ${lastError}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = message;
      if (isRestrictedPageError(message)) {
        throw new Error(GRIP_ERROR.PAGE_RESTRICTED);
      }
      if (isNoReceiverError(message) || message.includes(GRIP_ERROR.SHELL_UNAVAILABLE)) {
        await injectGripScripts(tabId);
      } else if (message.includes(GRIP_ERROR.BOOTSTRAP_FAILED)) {
        throw err instanceof Error ? err : new Error(message);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  if (lastError.includes(GRIP_ERROR.BOOTSTRAP_FAILED)) {
    throw new Error(lastError);
  }
  throw new Error(GRIP_ERROR.BOOTSTRAP_TIMEOUT);
}

const FLOATING_MESSAGE_TYPES = new Set([
  "TOGGLE_GRIP_TRAY",
  "SHOW_TRAY",
  "HIDE_TRAY",
  "NAVIGATE_TO_PICK",
]);

export function bootstrapFeatureForMessage(message: unknown): BootstrapFeature {
  const type = (message as { type?: string })?.type;
  return type && FLOATING_MESSAGE_TYPES.has(type) ? "floating" : "picker";
}

export async function sendToTabWhenReady(
  tabId: number,
  message: unknown,
  options?: { feature?: BootstrapFeature },
): Promise<void> {
  const feature = options?.feature ?? bootstrapFeatureForMessage(message);

  try {
    await ensureTabReady(tabId);
    await waitForBootstrap(tabId, feature);
    await sendToTab(tabId, message);
  } catch (err) {
    if (!(err instanceof Error) || !isNoReceiverError(err.message)) throw err;
    await ensureTabReady(tabId);
    await waitForBootstrap(tabId, feature);
    await sendToTab(tabId, message);
  }
}

export async function registerGripContentScripts(): Promise<void> {
  const loaderFile = getInjectLoaderFile();
  if (!loaderFile) return;

  try {
    await chrome.scripting.unregisterContentScripts({ ids: ["grip-inject"] });
  } catch {
    /* first registration */
  }

  await chrome.scripting.registerContentScripts([
    {
      id: "grip-inject",
      js: [loaderFile],
      matches: ["http://*/*", "https://*/*"],
      runAt: "document_start",
      allFrames: false,
    },
  ]);
}

export async function warmTab(tabId: number, url?: string): Promise<void> {
  if (!url || !/^https?:/i.test(url)) return;
  try {
    await ensureTabReady(tabId);
    void waitForBootstrap(tabId, "picker").catch(() => {
      /* best-effort warm */
    });
    void waitForBootstrap(tabId, "floating").catch(() => {
      /* best-effort warm */
    });
  } catch {
    /* tab may be restricted */
  }
}

export { GRIP_ERROR as REFRESH_HINT };
