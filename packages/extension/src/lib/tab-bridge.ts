const REFRESH_HINT = "Refresh this page, then try again.";

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

export async function injectGripScripts(tabId: number): Promise<void> {
  const modulePath = getInjectModulePath();
  const loaderFile = getInjectLoaderFile();

  if (modulePath) {
    try {
      await injectModule(tabId, modulePath);
      if (await pingTab(tabId)) return;
      if (await waitForGrip(tabId, 25, 100)) return;
    } catch {
      /* fall through to loader */
    }
  }

  if (!loaderFile) throw new Error(REFRESH_HINT);

  try {
    await injectLoader(tabId, loaderFile);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!isNoReceiverError(message) && !message.toLowerCase().includes("already")) {
      throw err;
    }
  }

  if (!(await waitForGrip(tabId))) {
    throw new Error(REFRESH_HINT);
  }
}

export async function ensureTabReady(tabId: number): Promise<void> {
  if (await pingTab(tabId)) return;
  await injectGripScripts(tabId);
  if (!(await pingTab(tabId))) {
    throw new Error(REFRESH_HINT);
  }
}

export async function sendToTabWhenReady(tabId: number, message: unknown): Promise<void> {
  try {
    await sendToTab(tabId, message);
  } catch (err) {
    if (!(err instanceof Error) || !isNoReceiverError(err.message)) throw err;
    await ensureTabReady(tabId);
    await sendToTab(tabId, message);
  }
}

export { REFRESH_HINT };
