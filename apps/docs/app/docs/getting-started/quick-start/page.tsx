import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";

const toc = [
  { id: "prerequisites", title: "Prerequisites", level: 2 as const },
  { id: "install", title: "Install & build", level: 2 as const },
  { id: "chrome", title: "Launch Chrome", level: 2 as const },
  { id: "extension", title: "Load the extension", level: 2 as const },
  { id: "mcp", title: "Configure MCP", level: 2 as const },
  { id: "verify", title: "Verify setup", level: 2 as const },
  { id: "mcp-badge", title: "MCP badge", level: 3 as const },
  { id: "pick-test", title: "Pick an element", level: 3 as const },
];

export default function QuickStartPage() {
  return (
    <DocPage
      title="Quick start"
      description="Get Grip running locally — monorepo build, Chrome remote debugging, extension load, and MCP connection."
      toc={toc}
    >
      <DocH2 id="prerequisites">Prerequisites</DocH2>
      <ul>
        <li>Node.js 20+ and pnpm</li>
        <li>Google Chrome (for extension and CDP)</li>
        <li>Go 1.22+ (or let <code>build:mcp</code> bootstrap a local toolchain)</li>
      </ul>

      <DocH2 id="install">Install &amp; build</DocH2>
      <CodeBlock>{`git clone <repo-url> grip
cd grip
pnpm install
pnpm turbo build
pnpm run build:mcp`}</CodeBlock>
      <p>
        This builds <code>@grip/core</code>, <code>@grip/devtools</code>, <code>@grip/extension</code>,
        and compiles <code>grip-mcp</code> to <code>bin/grip-mcp</code>.
      </p>

      <DocH2 id="chrome">Launch Chrome</DocH2>
      <p>
        Grip MCP connects over Chrome&apos;s remote debugging port (default <code>9222</code>):
      </p>
      <CodeBlock>{`./scripts/launch-chrome.sh 9222`}</CodeBlock>

      <DocH2 id="extension">Load the extension</DocH2>
      <CodeBlock>{`pnpm --filter @grip/extension build
# chrome://extensions → Developer mode → Load unpacked
# Select packages/extension/dist`}</CodeBlock>
      <p>For development with hot reload:</p>
      <CodeBlock>{`pnpm --filter @grip/extension dev`}</CodeBlock>

      <DocH2 id="mcp">Configure MCP</DocH2>
      <p>
        Add <code>grip-mcp</code> to your editor. See the full{" "}
        <a href="/docs/mcp/configuration">MCP configuration</a> guide for Cursor, env vars, and
        troubleshooting.
      </p>
      <CodeBlock>{`{
  "mcpServers": {
    "grip": {
      "command": "./bin/grip-mcp",
      "env": {
        "GRIP_CHROME_PORT": "9222",
        "GRIP_LOG_LEVEL": "info"
      }
    }
  }
}`}</CodeBlock>

      <DocH2 id="verify">Verify setup</DocH2>
      <DocH3 id="mcp-badge">MCP badge</DocH3>
      <p>
        Open the Grip popup, DevTools panel, or floating tray. The <strong>MCP</strong> chip turns{" "}
        <span className="doc-inline-ok">green</span> when <code>grip-mcp</code> can reach Chrome on
        the configured port. Yellow means MCP is not configured — click the chip for setup docs.
      </p>
      <DocH3 id="pick-test">Pick an element</DocH3>
      <p>
        Click <strong>Pick</strong> in any Grip UI surface, select an element on the page, and
        confirm it appears in pick history with CSS, XPath, and role metadata.
      </p>
    </DocPage>
  );
}
