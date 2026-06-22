chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "START_PICKER") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "START_PICKER" });
    });
    sendResponse({ ok: true });
  }
  if (msg.type === "PICKER_ELEMENT_SELECTED") {
    chrome.storage.session.set({ lastPick: msg.payload });
  }
  return true;
});
