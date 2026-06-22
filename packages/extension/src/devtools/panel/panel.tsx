import { render } from "preact";
import {
  devtoolsRuntime,
  GripPanelView,
  GripRuntimeProvider,
} from "@grip/devtools";
import "@grip/devtools-css";

render(
  <GripRuntimeProvider runtime={devtoolsRuntime}>
    <GripPanelView />
  </GripRuntimeProvider>,
  document.getElementById("app")!,
);
