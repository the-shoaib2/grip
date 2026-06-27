import type { GripMessage, PatchAppliedPayload, RegisterSessionContextPayload } from "@grip/core";
import { recordPatchApplied } from "../storage/patchHistoryStorage";

const SESSION_REGISTRY_KEY = "gripSessionRegistry";

export function handleRegisterSessionContext(
  msg: GripMessage<RegisterSessionContextPayload>,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  const payload = msg.payload;
  if (!payload?.sessionId) {
    sendResponse({ ok: false, error: "missing sessionId" });
    return false;
  }

  void chrome.storage.local
    .get(SESSION_REGISTRY_KEY)
    .then((data) => {
      const registry =
        data[SESSION_REGISTRY_KEY] && typeof data[SESSION_REGISTRY_KEY] === "object"
          ? (data[SESSION_REGISTRY_KEY] as Record<string, unknown>)
          : {};
      registry[payload.sessionId] = {
        sessionId: payload.sessionId,
        pickCount: payload.picks.length,
        registeredAt: Date.now(),
      };
      return chrome.storage.local.set({ [SESSION_REGISTRY_KEY]: registry });
    })
    .then(() => sendResponse({ ok: true, sessionId: payload.sessionId }))
    .catch((err) =>
      sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) }),
    );

  return true;
}

export function handlePatchApplied(
  msg: GripMessage<PatchAppliedPayload>,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  const payload = msg.payload;
  if (!payload?.filePath) {
    sendResponse({ ok: false, error: "missing filePath" });
    return false;
  }

  void recordPatchApplied(payload)
    .then(() => sendResponse({ ok: true }))
    .catch((err) =>
      sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) }),
    );

  return true;
}

export function handlePatchFailed(
  msg: GripMessage<{ error: string }>,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  sendResponse({ ok: false, error: msg.payload?.error ?? "patch failed" });
  return false;
}
