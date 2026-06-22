import { Nav } from "../components/Nav";

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

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Nav />
      <h1 className="text-3xl font-bold">MCP Tools</h1>
      <p className="mt-2 text-zinc-400">
        Exposed by <code className="text-blue-400">grip-mcp</code> for AI agents.
      </p>
      <ul className="mt-8 grid gap-3 font-mono text-sm">
        {tools.map((t) => (
          <li key={t} className="rounded border border-zinc-800 px-4 py-2 text-zinc-300">
            {t}()
          </li>
        ))}
      </ul>
    </main>
  );
}
