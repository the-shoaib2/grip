import { render } from "preact";
import {
  chromeRuntime,
  GripPopupView,
  GripRuntimeProvider,
} from "@grip/devtools";
import "@grip/devtools-css";

render(
  <GripRuntimeProvider runtime={chromeRuntime}>
    <GripPopupView />
  </GripRuntimeProvider>,
  document.getElementById("app")!,
);
