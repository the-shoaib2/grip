"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { headerLinks } from "@lib/navigation";
import { DocsSidebar } from "@components/docs/DocsSidebar";

export function DocsHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="docs-header">
      <div className="docs-header-inner">
        <div className="docs-header-start">
          <button
            type="button"
            className="docs-mobile-toggle"
            aria-label="Open documentation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <Link href="/" className="docs-logo">
            <span className="docs-logo-mark" aria-hidden />
            Grip
          </Link>
        </div>

        <nav className="docs-header-nav" aria-label="Site">
          {headerLinks.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(`${link.match ?? link.href}/`) ||
              (link.match ? pathname.startsWith(link.match) : false);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "docs-header-link docs-header-link-active" : "docs-header-link"}
                aria-current={active ? "page" : undefined}
              >
                {link.title}
              </Link>
            );
          })}
        </nav>
      </div>

      {mobileOpen ? (
        <div className="docs-mobile-drawer">
          <DocsSidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      ) : null}
    </header>
  );
}
