import Link from "next/link";
import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "overview", title: "What it is", level: 2 as const },
  { id: "views", title: "UI building blocks", level: 2 as const },
  { id: "surfaces", title: "Where it runs", level: 2 as const },
];

export default function DevtoolsPackagePage() {
  return (
    <DocPage
      title="@grip/devtools"
      description="All Grip UI in one place — popup, panel, floating tray, shared components, and runtime hooks."
      toc={toc}
    >
      <DocH2 id="overview">What it is</DocH2>
      <p>
        <code>@grip/devtools</code> is the Preact UI layer for Grip. Pick history, comments, MCP
        chip, session toolbar, and store all live here. One layout (<code>GripRootLayout</code> +{" "}
        <code>GripView</code>) powers popup, DevTools panel, and floating variants — so the UI
        looks and behaves the same everywhere.
      </p>

      <DocH2 id="views">UI building blocks</DocH2>
      <ul>
        <li>
          <code>GripView</code> — single entry point; pass <code>variant: popup | panel | floating</code>
        </li>
        <li>
          <code>GripPopupView</code> / <code>GripPanelView</code> — thin wrappers the extension mounts
        </li>
        <li>
          <code>mountFloatingGrip</code> — shadow DOM FAB + panel for in-page use
        </li>
        <li>
          Shared components — pick list, comment field, MCP chip, toolbars
        </li>
      </ul>
      <DocTip>
        Preview all variants locally: <code>pnpm dev:playground</code> → DevTools UI Lab.
      </DocTip>

      <DocH2 id="surfaces">Where it runs</DocH2>
      <ul>
        <li>
          Extension popup — <code>packages/extension/src/popup</code>
        </li>
        <li>
          DevTools panel — <code>packages/extension/src/devtools/panel</code>
        </li>
        <li>
          Floating tray — content script via <code>mountFloatingGrip</code>
        </li>
        <li>
          Playground — <code>apps/playground/src/devtools-lab.tsx</code>
        </li>
      </ul>
      <p>
        Data layer: <Link href="/docs/packages/core">@grip/core</Link>. Browser automation:{" "}
        <Link href="/docs/packages/mcp-server">grip-mcp</Link>.
      </p>
    </DocPage>
  );
}
