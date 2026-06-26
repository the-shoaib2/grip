import { render } from "preact";
import { GripRuntimeProvider } from "@grip/devtools";
import "@grip/devtools-css";
import "../../../packages/devtools/src/floating/floating.css";
import { DevToolsLabContent } from "./lab/DevToolsLabContent";
import { playgroundRuntime } from "./mockRuntime";
import "./styles/devtools-lab.css";

function DevToolsLab() {
  return (
    <GripRuntimeProvider runtime={playgroundRuntime}>
      <DevToolsLabContent />
    </GripRuntimeProvider>
  );
}

render(<DevToolsLab />, document.getElementById("app")!);
