export default function Home() {
  const tools = [
    "snapshot",
    "highlight",
    "click",
    "fill",
    "read_logs",
    "read_network",
    "screenshot",
    "pick_element",
    "navigate",
    "eval",
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Grip</h1>
      <p className="mt-2 text-lg text-zinc-400">Grab anything on the web.</p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Packages</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>
            <code className="text-blue-400">@grip/core</code> — selectors, a11y snapshots, ref maps
          </li>
          <li>
            <code className="text-blue-400">@grip/extension</code> — Chrome MV3 picker + DevTools panel
          </li>
          <li>
            <code className="text-blue-400">grip-mcp</code> — Go MCP server for AI agents
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">MCP Tools</h2>
        <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm text-zinc-400">
          {tools.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
