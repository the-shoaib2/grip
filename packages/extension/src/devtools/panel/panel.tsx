import { render } from "preact";
import {
  devtoolsRuntime,
  GripPanelView,
  GripRuntimeProvider,
  usePageContextEditor,
} from "@grip/devtools";
import "@grip/devtools-css";

function PanelApp() {
  const openPageContextEditor = usePageContextEditor();
  return (
    <GripPanelView
      onContextEditRequest={(pick, meta) => openPageContextEditor(pick, meta)}
    />
  );
}

render(
  <GripRuntimeProvider runtime={devtoolsRuntime}>
    <PanelApp />
  </GripRuntimeProvider>,
  document.getElementById("app")!,
);
