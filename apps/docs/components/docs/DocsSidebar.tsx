"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNavigation } from "@lib/navigation";

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="docs-sidebar" aria-label="Documentation">
      {docsNavigation.map((group) => (
        <div key={group.title} className="docs-sidebar-group">
          <p className="docs-sidebar-group-title">{group.title}</p>
          <ul className="docs-sidebar-list">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={active ? "docs-sidebar-link docs-sidebar-link-active" : "docs-sidebar-link"}
                    onClick={onNavigate}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
