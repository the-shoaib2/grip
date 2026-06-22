import { Nav } from "../components/Nav";

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Nav />
      <h1 className="text-3xl font-bold">Documentation</h1>
      <section className="mt-8 space-y-6 text-zinc-300">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Quick start</h2>
          <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
            {`pnpm install
pnpm turbo build
pnpm run build:mcp
./scripts/launch-chrome.sh 9222`}
          </pre>
        </div>
        <div>
          <h2 id="mcp" className="text-lg font-semibold text-zinc-100 scroll-mt-20">
            MCP configuration
          </h2>
          <p className="mt-2 text-zinc-400">
            Grip MCP connects to Chrome over the remote debugging port (default{" "}
            <code className="text-zinc-300">9222</code>). Launch Chrome with debugging enabled,
            build the MCP server, then add it to your editor.
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
            {`pnpm run build:mcp
./scripts/launch-chrome.sh 9222

# Cursor: .cursor/mcp.json
# Env: GRIP_CHROME_PORT=9222`}
          </pre>
          <p className="mt-3 text-zinc-400">
            When configured, the <strong className="text-zinc-200">MCP</strong> badge in the Grip
            popup, DevTools panel, and floating tray turns green.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Packages</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
            <li>
              <code>@grip/core</code> — selectors, snapshots, ref maps
            </li>
            <li>
              <code>@grip/extension</code> — Chrome MV3 picker + DevTools
            </li>
            <li>
              <code>grip-mcp</code> — Go MCP server (chromedp)
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
