import { render } from "preact";
import {
  chromeRuntime,
  GripPanelView,
  GripRuntimeProvider,
} from "@grip/devtools";
import "@grip/devtools-css";

render(
  <GripRuntimeProvider runtime={chromeRuntime}>
    <GripPanelView />
  </GripRuntimeProvider>,
  document.getElementById("app")!,
);
