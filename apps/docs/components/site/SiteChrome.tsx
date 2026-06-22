import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeaderNav } from "@components/site/SiteHeaderNav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="docs-logo">
          <span className="docs-logo-mark" aria-hidden />
          Grip
        </Link>
        <SiteHeaderNav />
      </div>
    </header>
  );
}

export function SiteFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-tagline">Grab anything on the web.</p>
        <div className="site-footer-links">
          <Link href="/docs/getting-started/intro">Docs</Link>
          <Link href="/docs/mcp/configuration">MCP</Link>
          <Link href="/docs/extension">Extension</Link>
        </div>
        <p className="site-footer-copy">© {new Date().getFullYear()} Grip · MIT</p>
      </div>
    </footer>
  );
}
