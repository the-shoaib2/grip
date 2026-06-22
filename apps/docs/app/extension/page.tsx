import { Nav } from "../components/Nav";

export default function ExtensionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Nav />
      <h1 className="text-3xl font-bold">Chrome Extension</h1>
      <p className="mt-2 text-zinc-400">
        Visual element picker, console log capture, and DevTools inspector panel.
      </p>
      <section className="mt-8 space-y-4 text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-100">Build & load</h2>
        <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
          {`pnpm --filter @grip/extension build
# chrome://extensions → Load unpacked → packages/extension/dist`}
        </pre>
        <h2 id="mcp" className="text-lg font-semibold text-zinc-100 scroll-mt-20">
          MCP configuration
        </h2>
        <p className="text-zinc-400">
          See the full setup guide on the{" "}
          <a href="/docs#mcp" className="text-blue-400 hover:underline">
            MCP configuration
          </a>{" "}
          docs page. Summary:
        </p>
        <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
          {`pnpm run build:mcp
./scripts/launch-chrome.sh 9222`}
        </pre>
        <h2 className="text-lg font-semibold text-zinc-100">Components</h2>
        <ul className="list-inside list-disc space-y-1 text-zinc-400">
          <li>content_scripts/picker.ts — hover + click to select</li>
          <li>content_scripts/log-injector.ts — console.* at document_start</li>
          <li>service_worker/background.ts — IPC + session storage</li>
          <li>devtools/panel — selector output + log viewer</li>
        </ul>
      </section>
    </main>
  );
}
