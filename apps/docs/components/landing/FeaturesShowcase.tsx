import Link from "next/link";

export function FeaturesShowcase() {
  return (
    <section className="w-full py-16 px-6 border-b border-zinc-900 bg-zinc-950/10">
      <div className="max-w-6xl mx-auto">
        {/* Bento Grid Header */}
        <div className="mb-12 text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Ecosystem Architecture
          </h2>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: grip-dev (Core NPM Library) - 2/3 width on desktop */}
          <Link
            href="/docs/packages/core"
            className="group relative md:col-span-2 flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-950/60"
          >
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-500/20 bg-zinc-500/5 text-zinc-400 group-hover:bg-zinc-500 group-hover:text-white transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white font-mono tracking-tight">@grip/core</h3>
            </div>
            {/* Live code mockup inside Bento card */}
            <div className="mt-6 overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-300">
              <span className="text-zinc-500">// Generate selector and accessibility snapshots</span>
              <div className="mt-1">
                <span className="text-zinc-400">const</span> selector = <span className="text-zinc-300">generateSelector</span>(element);
              </div>
              <div>
                <span className="text-zinc-400">const</span> snapshot = <span className="text-zinc-300">buildSnapshotForLLM</span>(document);
              </div>
            </div>
          </Link>

          {/* Card 2: @grip/extension (Visual Picker) - 1/3 width on desktop */}
          <Link
            href="/docs/extension"
            className="group flex flex-col justify-between rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-950/60"
          >
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-500/20 bg-zinc-500/5 text-zinc-400 group-hover:bg-zinc-500 group-hover:text-white transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8" />
                  <path d="M12 8v8" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white font-mono tracking-tight">@grip/extension</h3>
            </div>
            <div className="mt-6 border-t border-zinc-900/60 pt-4 flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
              <span>View extension guide</span>
              <span>→</span>
            </div>
          </Link>

          {/* Card 3: grip-mcp (Daemon Server) - 1/3 width on desktop */}
          <Link
            href="/docs/packages/mcp-server"
            className="group flex flex-col justify-between rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-950/60"
          >
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-500/20 bg-zinc-500/5 text-zinc-400 group-hover:bg-zinc-500 group-hover:text-white transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 17h16" />
                  <path d="M4 12h16" />
                  <path d="M4 7h16" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white font-mono tracking-tight">grip-mcp (Go Legacy)</h3>
            </div>
            <div className="mt-6 border-t border-zinc-900/60 pt-4 flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
              <span>View server reference</span>
              <span>→</span>
            </div>
          </Link>

          {/* Card 4: AI Agents & Clients - 2/3 width on desktop */}
          <div className="group md:col-span-2 flex flex-col justify-between rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-950/60">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-500/20 bg-zinc-500/5 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white font-mono tracking-tight">AI Agent Integrations</h3>
            </div>
            {/* Display list of badges in bento card */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs font-medium text-zinc-300">Cursor</span>
              <span className="rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs font-medium text-zinc-300">Claude Desktop</span>
              <span className="rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs font-medium text-zinc-300">VS Code Agent</span>
              <span className="rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs font-medium text-zinc-300">Zed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
