import { Nav } from "./components/Nav";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Nav />
      <h1 className="text-4xl font-bold tracking-tight">Grip</h1>
      <p className="mt-2 text-lg text-zinc-400">Grab anything on the web.</p>
      <p className="mt-6 text-zinc-300">
        Open-source browser element selector, accessibility inspector, log reader,
        and AI agent browser interface.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { title: "@grip/core", desc: "Selectors + a11y snapshots", href: "/docs" },
          { title: "@grip/extension", desc: "Chrome MV3 picker", href: "/extension" },
          { title: "grip-mcp", desc: "Go MCP server", href: "/tools" },
        ].map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="rounded-lg border border-zinc-800 p-4 hover:border-zinc-600"
          >
            <div className="font-mono text-sm text-blue-400">{c.title}</div>
            <div className="mt-1 text-sm text-zinc-500">{c.desc}</div>
          </a>
        ))}
      </div>
    </main>
  );
}
