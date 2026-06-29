import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "prerequisites", title: "Before you start", level: 2 as const },
  { id: "install", title: "Install & build", level: 2 as const },
  { id: "chrome", title: "Launch Chrome", level: 2 as const },
  { id: "extension", title: "Load the extension", level: 2 as const },
  { id: "mcp", title: "Connect MCP", level: 2 as const },
  { id: "verify", title: "Check it works", level: 2 as const },
  { id: "mcp-badge", title: "MCP badge", level: 3 as const },
  { id: "pick-test", title: "Pick an element", level: 3 as const },
];

export default function QuickStartPage() {
  return (
    <DocPage
      title="Quick start"
      description="Get Grip running locally in a few steps — build the repo, open Chrome with debugging, load the extension, and connect your AI tool."
      toc={toc}
    >
      <DocH2 id="prerequisites">Before you start</DocH2>
      <p>Make sure you have:</p>
      <ul>
        <li>
          <strong>Node.js 20+</strong> and <strong>pnpm</strong>
        </li>
        <li>
          <strong>Google Chrome</strong> — for the extension and browser automation
        </li>
        <li>
          <strong>Go 1.22+</strong> — or let <code>pnpm run build:mcp</code> install a local Go
          toolchain for you
        </li>
      </ul>

      <DocH2 id="install">Install &amp; build</DocH2>
      <p>Clone the repo and install dependencies using your preferred package manager (pnpm is recommended):</p>
      <CodeBlock>{`git clone <repo-url> grip
cd grip

# Using pnpm (recommended)
pnpm install
pnpm turbo build
pnpm run build:mcp

# Using npm
npm install
npm run build
npm run build:mcp

# Using yarn
yarn install
yarn build
yarn build:mcp

# Using bun
bun install
bun run build
bun run build:mcp`}</CodeBlock>
      <p>
        When this finishes, you should have <code>bin/grip-mcp</code> ready and the extension build
        in <code>packages/extension/dist</code>.
      </p>

      <DocH2 id="chrome">Launch Chrome</DocH2>
      <p>
        Grip talks to Chrome over the remote debugging port (default <code>9222</code>). Use the
        helper script so you don&apos;t have to remember flags:
      </p>
      <CodeBlock>{`./scripts/launch-chrome.sh 9222`}</CodeBlock>
      <DocTip>
        Keep this Chrome window open while you use Grip or MCP. Closing it breaks the connection.
      </DocTip>

      <DocH2 id="extension">Load the extension</DocH2>
      <p>Build and load the unpacked extension in Chrome:</p>
      <CodeBlock>{`pnpm --filter @grip/extension build`}</CodeBlock>
      <p>Then in Chrome:</p>
      <ol>
        <li>
          Open <code>chrome://extensions</code>
        </li>
        <li>
          Turn on <strong>Developer mode</strong>
        </li>
        <li>
          Click <strong>Load unpacked</strong> and choose <code>packages/extension/dist</code>
        </li>
      </ol>
      <p>For day-to-day development with reload on save:</p>
      <CodeBlock>{`# Using pnpm
pnpm --filter @grip/extension dev

# Using npm
npm run dev --workspace=packages/extension

# Using yarn
yarn workspace @grip/extension dev

# Using bun
bun --filter @grip/extension dev`}</CodeBlock>

      <DocH2 id="mcp">Connect MCP</DocH2>
      <p>
        Add <code>grip-mcp</code> to your editor or CLI. The exact file depends on your tool — see
        the full{" "}
        <Link href="/docs/mcp/configuration">MCP configuration guide</Link> for Cursor, VS Code,
        Claude Code, Gemini CLI, OpenCode, and others.
      </p>
      <p>Here is a minimal example (works in Cursor and most <code>mcpServers</code> clients):</p>
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
      <DocTip>
        Use an absolute path to <code>grip-mcp</code> if your tool&apos;s working directory is not
        the repo root.
      </DocTip>

      <DocH2 id="verify">Check it works</DocH2>
      <DocH3 id="mcp-badge">MCP badge</DocH3>
      <p>
        Open Grip from the extension icon, DevTools panel, or floating tray. Look at the{" "}
        <strong>MCP</strong> chip in the header:
      </p>
      <ul>
        <li>
          <span className="doc-inline-ok">Green</span> — Chrome is reachable on port 9222. You&apos;re
          good to go.
        </li>
        <li>
          <span className="doc-inline-warn">Yellow</span> — not connected yet. Click the chip for
          setup help, or follow the{" "}
          <Link href="/docs/mcp/configuration">MCP configuration guide</Link>.
        </li>
      </ul>
      <DocH3 id="pick-test">Pick an element</DocH3>
      <p>
        Click <strong>Pick</strong>, then click anything on the page. You should see it in pick
        history with tag, role, CSS, XPath, and optional comment — that confirms the full loop is
        working.
      </p>
    </DocPage>
  );
}
