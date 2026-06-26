import type { GripMessage, LogMessagePayload } from "@grip/core";

export const MAX_LOGS = 500;
export const logs: LogMessagePayload[] = [];
export const bootstrapErrors = new Map<number, string>();

export function isInspectableUrl(url?: string): boolean {
  if (!url) return false;
  return /^https?:/i.test(url);
}

export async function resolveTargetTab(
  sender: chrome.runtime.MessageSender,
  msg: GripMessage,
): Promise<chrome.tabs.Tab | undefined> {
  if (sender.tab?.id) return sender.tab;

  if (typeof msg.tabId === "number") {
    try {
      return await chrome.tabs.get(msg.tabId);
    } catch {
      /* fall through */
    }
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

export function respondError(
  sendResponse: (response: { ok: false; error: string }) => void,
  err: unknown,
  tabId?: number,
): void {
  try {
    let message = err instanceof Error ? err.message : undefined;
    const bootstrapErr = tabId != null ? bootstrapErrors.get(tabId) : undefined;
    if (bootstrapErr) {
      message = message
        ? `${message}: ${bootstrapErr}`
        : `GRIP_BOOTSTRAP_FAILED: ${bootstrapErr}`;
    }
    sendResponse({
      ok: false,
      error: message ?? "GRIP_SHELL_UNAVAILABLE",
    });
  } catch {
    // Receiver closed before error was sent.
  }
}
