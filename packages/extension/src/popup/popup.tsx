import { render } from "preact";
import "../styles/globals.css";

function Popup() {
  const startPicker = () => {
    chrome.runtime.sendMessage({ type: "START_PICKER" }, () => {
      void chrome.runtime.lastError;
      window.close();
    });
  };

  return (
    <div className="w-60 bg-zinc-950 p-3 font-sans text-zinc-100">
      <h1 className="text-base font-semibold">Grip</h1>
      <p className="mt-1 text-xs text-zinc-500">Grab anything on the web.</p>
      <button
        type="button"
        onClick={startPicker}
        className="mt-3 w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Pick element
      </button>
    </div>
  );
}

render(<Popup />, document.getElementById("app")!);
