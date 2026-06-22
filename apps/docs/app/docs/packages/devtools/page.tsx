import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "views", title: "Views & layout", level: 2 as const },
  { id: "surfaces", title: "Where it mounts", level: 2 as const },
];

export default function DevtoolsPackagePage() {
  return (
    <DocPage
      title="@grip/devtools"
      description="Shared Preact UI — popup, DevTools panel, floating tray, components, and runtime adapters."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        <code>@grip/devtools</code> contains all user-facing Grip UI: pick history, comment field,
        MCP chip, session toolbar, and Zustand store. One <code>GripRootLayout</code> and{" "}
        <code>GripView</code> power popup, panel, and floating variants without duplicating markup.
      </p>

      <DocH2 id="views">Views &amp; layout</DocH2>
      <ul>
        <li>
          <code>GripView</code> — unified entry with <code>variant: popup | panel | floating</code>
        </li>
        <li>
          <code>GripRootLayout</code> — responsive shell classes per surface
        </li>
        <li>
          <code>GripPopupView</code>, <code>GripPanelView</code> — thin wrappers for extension mounts
        </li>
        <li>
          <code>mountFloatingGrip</code> — shadow DOM FAB + panel (<code>@grip/devtools/floating</code>)
        </li>
      </ul>

      <DocH2 id="surfaces">Where it mounts</DocH2>
      <ul>
        <li>Extension popup — <code>packages/extension/src/popup</code></li>
        <li>DevTools panel — <code>packages/extension/src/devtools/panel</code></li>
        <li>Floating tray — content script via <code>mountFloatingGrip</code></li>
        <li>Playground lab — <code>apps/playground/src/devtools-lab.tsx</code></li>
      </ul>
    </DocPage>
  );
}
