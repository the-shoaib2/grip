import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "overview", title: "What you get", level: 2 as const },
  { id: "build", title: "Install the extension", level: 2 as const },
  { id: "surfaces", title: "Three ways to open Grip", level: 2 as const },
  { id: "context-retrieval", title: "How context is fetched", level: 2 as const },
  { id: "components", title: "How it's built", level: 2 as const },
  { id: "mcp", title: "Connect MCP", level: 2 as const },
];

export default function ExtensionPage() {
  return (
    <DocPage
      title="Chrome extension"
      description="Pick elements on any page, view history, and use the same UI from the toolbar, DevTools, or a floating panel."
      toc={toc}
    >
      <DocH2 id="overview">What you get</DocH2>
      <p>
        The Grip extension adds element picking, session history, and console log capture to Chrome.
        All surfaces — popup, DevTools panel, and in-page floating tray — share one UI from{" "}
        <code>@grip/devtools</code>, so you get the same experience everywhere.
      </p>
      <ul>
        <li>
          <strong>Pick</strong> any element and copy selectors or MCP context
        </li>
        <li>
          <strong>History</strong> of picks for the current session
        </li>
        <li>
          <strong>MCP badge</strong> showing whether Chrome debugging is connected
        </li>
      </ul>

      <DocH2 id="build">Install the extension</DocH2>
      <p>Build the extension bundle:</p>
      <CodeBlock>{`pnpm --filter @grip/extension build`}</CodeBlock>
      <p>Load it in Chrome:</p>
      <ol>
        <li>
          Open <code>chrome://extensions</code>
        </li>
        <li>
          Enable <strong>Developer mode</strong> (top right)
        </li>
        <li>
          Click <strong>Load unpacked</strong> → select <code>packages/extension/dist</code>
        </li>
      </ol>
      <DocTip>
        For active development, run <code>pnpm --filter @grip/extension dev</code> and reload the
        extension after changes.
      </DocTip>

      <DocH2 id="surfaces">Three ways to open Grip</DocH2>
      <ul>
        <li>
          <strong>Popup</strong> — click the Grip icon in the toolbar. Compact and quick; can close
          after a successful pick.
        </li>
        <li>
          <strong>DevTools panel</strong> — open Chrome DevTools and switch to the Grip panel. Stays
          open while you debug; syncs session with the background worker.
        </li>
        <li>
          <strong>Floating tray</strong> — a button on the page itself (bottom-right). Opens the
          full panel without leaving the tab.
        </li>
      </ul>

      <DocH2 id="context-retrieval">How context is fetched</DocH2>
      <DocH3 id="frontend-retrieval">Frontend &amp; Extension Picker</DocH3>
      <p>
        When running as a standard Chrome extension, Grip relies on content scripts injected directly into the tab&apos;s frontend environment.
      </p>
      <ul>
        <li>
          <strong>Live DOM Interaction:</strong> The element picker (<code>picker.ts</code>) overlays a visual target canvas. Hovering and clicking targets elements directly via the browser&apos;s Pointer Events API.
        </li>
        <li>
          <strong>Framework Detection:</strong> The frontend script inspects DOM nodes to find internal keys (such as React&apos;s <code>__reactFiber$</code> or Vue&apos;s <code>__vnode</code>). This allows it to extract real-time component <code>props</code>, parent state, and original template details directly from the running app context.
        </li>
        <li>
          <strong>Isolated Sandbox:</strong> Because it operates in the page context, it is fast and has zero overhead, but is restricted to elements present in the active DOM tree.
        </li>
      </ul>

      <DocH3 id="devtools-retrieval">DevTools Panel &amp; DOM Inspection</DocH3>
      <p>
        When running inside the Chrome DevTools panel, Grip benefits from elevated privileges through Chrome&apos;s DevTools Extension APIs.
      </p>
      <ul>
        <li>
          <strong>Inspected Window Access:</strong> It utilizes <code>chrome.devtools.inspectedWindow.eval()</code> to run expression queries in the main frame, bridging DOM nodes directly to the DevTools console scope.
        </li>
        <li>
          <strong>Source Maps &amp; Exact Code:</strong> DevTools has access to active JS source maps loaded by the browser. When an element is selected, Grip can trace the compiled code back to the exact source file path, component class, and line number on your filesystem.
        </li>
      </ul>

      <DocH2 id="components">How it&apos;s built</DocH2>
      <DocH3 id="content-scripts">Content scripts</DocH3>
      <ul>
        <li>
          <code>picker.ts</code> — overlay, multi-pick, inline comments
        </li>
        <li>
          <code>log-injector.ts</code> — captures <code>console.*</code> early
        </li>
        <li>
          <code>floating-mount.ts</code> — in-page floating UI
        </li>
      </ul>
      <DocH3 id="background">Background</DocH3>
      <p>
        <code>background.ts</code> handles messaging between tabs, pick history, and session storage.
      </p>
      <DocH3 id="devtools-panel">DevTools</DocH3>
      <p>
        <code>devtools/panel</code> mounts the shared <code>GripPanelView</code> inside Chrome
        DevTools.
      </p>

      <DocH2 id="mcp">Connect MCP</DocH2>
      <p>
        To let AI tools control the same browser, set up <code>grip-mcp</code> and launch Chrome
        with debugging:
      </p>
      <CodeBlock>{`pnpm run build:mcp
./scripts/launch-chrome.sh 9222`}</CodeBlock>
      <p>
        Full setup for every IDE and CLI:{" "}
        <Link href="/docs/mcp/configuration">MCP configuration</Link>.
      </p>
    </DocPage>
  );
}
