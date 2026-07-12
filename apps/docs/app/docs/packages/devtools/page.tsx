import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "surfaces", title: "Where it runs", level: 2 as const },
];

export default function DevtoolsPackagePage() {
  return (
    <DocPage
      title="@grip/devtools"
      description="The universal UI layer for Grip. Provides shared components for the extension popup, DevTools panel, and floating tray."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        <code>@grip/devtools</code> houses the Preact-based UI layer for the entire Grip ecosystem. It ensures that features like pick history, comments, and the MCP status badge look and behave identically no matter how you open Grip.
      </p>
      <p>
        It exposes a single universal entry point (<code>GripView</code>) which seamlessly adapts to run as a popup window, a Chrome DevTools panel, or a floating shadow DOM tray injected directly into a live page.
      </p>

      <DocH2 id="surfaces">Where it runs</DocH2>
      <ul>
        <li>
          <strong>Extension Popup</strong> — The compact view opened by clicking the Grip icon in the Chrome toolbar.
        </li>
        <li>
          <strong>DevTools Panel</strong> — The persistent panel integrated directly into Chrome Developer Tools.
        </li>
        <li>
          <strong>Floating Tray</strong> — A shadow DOM widget that overlays on the active web page, mounted via <code>mountFloatingGrip</code>.
        </li>
      </ul>
      <DocTip>
        Want to preview all the UI variants locally? Run <code>pnpm dev:playground</code> to access the dedicated DevTools UI Lab.
      </DocTip>
    </DocPage>
  );
}
