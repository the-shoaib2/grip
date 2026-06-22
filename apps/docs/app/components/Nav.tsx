import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/tools", label: "MCP Tools" },
  { href: "/extension", label: "Extension" },
];

export function Nav() {
  return (
    <nav className="mb-12 flex gap-6 text-sm text-zinc-400">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-zinc-100">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
