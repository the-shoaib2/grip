export function Popup() {
  const startPicker = () => {
    chrome.runtime.sendMessage({ type: "START_PICKER" });
    window.close();
  };

  return (
    <div style={{ width: 240, padding: 12, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 16, margin: "0 0 8px" }}>Grip</h1>
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
        Grab anything on the web.
      </p>
      <button type="button" onClick={startPicker} style={{ width: "100%" }}>
        Pick element
      </button>
    </div>
  );
}
