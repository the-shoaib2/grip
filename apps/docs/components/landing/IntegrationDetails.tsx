import Link from "next/link";

export function IntegrationDetails() {
  return (
    <section className="w-full py-16 px-6 bg-zinc-950/10">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="w-full mb-12 text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Architecture Layout
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            Bridges target browser environments to host IDE workspaces safely and efficiently.
          </p>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Card 1 */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-950/60">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              1. Content Scripts
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Injects target page observers. Parses internal React fiber nodes to extract structured component props, states, and coordinates.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-950/60">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              2. Chrome DevTools API
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Elevated extension context. Resolves source mappings on the fly to match target selectors back to original local files and line numbers.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-950/60">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              3. Go Daemon
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Background MCP server. Forwards agent tool calls (snapshots, element interactions, keyboard input) directly to connected debug tabs.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-400">
            Ready to integrate? Review the setup guidelines.
          </p>
          <Link
            href="/docs/mcp/configuration"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-900 hover:border-zinc-700"
          >
            Read Configuration Docs
          </Link>
        </div>
      </div>
    </section>
  );
}
