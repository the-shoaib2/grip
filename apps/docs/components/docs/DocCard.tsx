import Link from "next/link";
import type { ReactNode } from "react";

export function DocCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="doc-card">
      <h3 className="doc-card-title">{title}</h3>
      <p className="doc-card-desc">{description}</p>
    </Link>
  );
}

export function DocCardGrid({ children }: { children: ReactNode }) {
  return <div className="doc-card-grid">{children}</div>;
}
