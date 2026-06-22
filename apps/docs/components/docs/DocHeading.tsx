import type { ReactNode } from "react";

export function DocH2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="doc-h2">
      {children}
    </h2>
  );
}

export function DocH3({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="doc-h3">
      {children}
    </h3>
  );
}
