import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "build", title: "Build & load", level: 2 as const },
  { id: "surfaces", title: "UI surfaces", level: 2 as const },
  { id: "components", title: "Architecture", level: 2 as const },
  { id: "content-scripts", title: "Content scripts", level: 3 as const },
  { id: "background", title: "Service worker", level: 3 as const },
  { id: "devtools-panel", title: "DevTools panel", level: 3 as const },
  { id: "mcp", title: "MCP integration", level: 2 as const },
];

export default function ExtensionPage() {
  return (
    <DocPage
      title="Chrome extension"
      description="Visual element picker, console log capture, DevTools panel, and in-page floating tray."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        The <code>@grip/extension</code> package is a Chrome MV3 extension that mounts shared UI from{" "}
        <code>@grip/devtools</code>. It provides element picking, session history, log injection,
        and three UI surfaces that share one root layout.
      </p>

      <DocH2 id="build">Build &amp; load</DocH2>
      <CodeBlock>{`pnpm --filter @grip/extension build
# chrome://extensions → Developer mode → Load unpacked
# Select packages/extension/dist`}</CodeBlock>
      <p>Development with watch mode:</p>
      <CodeBlock>{`pnpm --filter @grip/extension dev`}</CodeBlock>

      <DocH2 id="surfaces">UI surfaces</DocH2>
      <ul>
        <li>
          <strong>Popup</strong> — compact toolbar from the extension icon; closes on successful pick
          when configured.
        </li>
        <li>
          <strong>DevTools panel</strong> — full panel docked in Chrome DevTools; syncs session storage
          with the service worker.
        </li>
        <li>
          <strong>Floating tray</strong> — in-page FAB + panel via shadow DOM on any tab.
        </li>
      </ul>

      <DocH2 id="components">Architecture</DocH2>
      <DocH3 id="content-scripts">Content scripts</DocH3>
      <ul>
        <li>
          <code>picker.ts</code> — hover overlay, multi-pick session, inline comment composer
        </li>
        <li>
          <code>log-injector.ts</code> — captures <code>console.*</code> at document_start
        </li>
        <li>
          <code>floating-mount.ts</code> — mounts <code>@grip/devtools-floating</code> tray
        </li>
      </ul>
      <DocH3 id="background">Service worker</DocH3>
      <ul>
        <li>
          <code>background.ts</code> — tab messaging, pick history, MCP tray toggle, session storage
        </li>
      </ul>
      <DocH3 id="devtools-panel">DevTools panel</DocH3>
      <ul>
        <li>
          <code>devtools/panel</code> — mounts <code>GripPanelView</code> with shared devtools UI
        </li>
      </ul>

      <DocH2 id="mcp">MCP integration</DocH2>
      <p>
        Configure <code>grip-mcp</code> so the MCP badge in the extension UI reflects connection
        status. See the{" "}
        <Link href="/docs/mcp/configuration">MCP configuration</Link> guide.
      </p>
      <CodeBlock>{`pnpm run build:mcp
./scripts/launch-chrome.sh 9222`}</CodeBlock>
    </DocPage>
  );
}
