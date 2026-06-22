export function isExtensionContextValid(): boolean {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

export function safeSendMessage(
  message: unknown,
  callback?: (response: unknown) => void,
): void {
  if (!isExtensionContextValid()) return;
  try {
    chrome.runtime.sendMessage(message, (response) => {
      void chrome.runtime.lastError;
      callback?.(response);
    });
  } catch {
    // Extension was reloaded while this content script was still injected.
  }
}
