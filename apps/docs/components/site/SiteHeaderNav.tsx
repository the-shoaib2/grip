"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { headerLinks } from "@lib/navigation";

export function SiteHeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="site-header-nav" aria-label="Site">
      {headerLinks.map((link) => {
        const active =
          pathname === link.href ||
          (link.match ? pathname.startsWith(link.match) : pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "docs-header-link docs-header-link-active" : "docs-header-link"}
          >
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}
