import { useEffect, useState } from "preact/hooks";
import type { PickerElementPayload } from "@grip/core";

export function App() {
  const [pick, setPick] = useState<PickerElementPayload | null>(null);

  useEffect(() => {
    chrome.storage.session.get("lastPick", (data) => {
      if (data.lastPick) setPick(data.lastPick as PickerElementPayload);
    });
    const listener = (msg: { type: string; payload: PickerElementPayload }) => {
      if (msg.type === "PICKER_ELEMENT_SELECTED") setPick(msg.payload);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  if (!pick) {
    return (
      <div style={{ padding: 12, fontFamily: "monospace", fontSize: 12 }}>
        Use the popup to pick an element.
      </div>
    );
  }

  return (
    <div style={{ padding: 12, fontFamily: "monospace", fontSize: 12 }}>
      <div>
        <strong>CSS:</strong> {pick.css}
      </div>
      <div>
        <strong>XPath:</strong> {pick.xpath}
      </div>
      <div>
        <strong>Role:</strong> {pick.role}
      </div>
      <div>
        <strong>Shadow DOM:</strong> {pick.shadowDOM ? "yes" : "no"}
      </div>
    </div>
  );
}
