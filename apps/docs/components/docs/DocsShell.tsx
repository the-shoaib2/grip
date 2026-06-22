import type { ReactNode } from "react";
import { DocsFooter } from "@components/docs/DocsFooter";
import { DocsHeader } from "@components/docs/DocsHeader";
import { DocsSidebar } from "@components/docs/DocsSidebar";

export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <div className="docs-shell">
      <DocsHeader />
      <div className="docs-layout">
        <div className="docs-body">
          <aside className="docs-sidebar-aside">
            <DocsSidebar />
          </aside>
          <main className="docs-main">{children}</main>
        </div>
      </div>
      <DocsFooter />
    </div>
  );
}
