import Link from "next/link";
import { SiteFooter, SiteHeader } from "@components/site/SiteChrome";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="landing-main">
        <h1 className="landing-hero-title">Grip</h1>
        <p className="landing-hero-sub">Grab anything on the web.</p>
        <p className="landing-hero-desc">
          Open-source browser element selector, accessibility inspector, log reader,
          and AI agent browser interface — with a shared UI across popup, DevTools panel,
          and floating tray, plus MCP tools for Cursor and other clients.
        </p>
        <Link href="/docs/getting-started/intro" className="landing-cta">
          Read the docs
        </Link>
        <div className="landing-cards">
          {[
            { title: "@grip/core", desc: "Selectors + a11y snapshots", href: "/docs/packages/core" },
            { title: "@grip/extension", desc: "Chrome MV3 picker", href: "/docs/extension" },
            { title: "grip-mcp", desc: "Go MCP server", href: "/docs/packages/mcp-server" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="landing-card">
              <div className="landing-card-title">{c.title}</div>
              <div className="landing-card-desc">{c.desc}</div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
