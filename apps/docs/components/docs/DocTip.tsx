import type { ReactNode } from "react";

export function DocTip({ children }: { children: ReactNode }) {
  return <p className="doc-tip">{children}</p>;
}
