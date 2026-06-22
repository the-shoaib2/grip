import type { ReactNode } from "react";
import { DocsFooter } from "@components/docs/DocsFooter";
import { DocsHeader } from "@components/docs/DocsHeader";
import { DocsSidebar } from "@components/docs/DocsSidebar";
import { DocsToc } from "@components/docs/DocsToc";
import { DocsTocProvider } from "@components/docs/DocsTocContext";

export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <DocsTocProvider>
      <div className="docs-shell">
        <DocsHeader />
        <div className="docs-layout">
          <div className="docs-body">
            <aside className="docs-sidebar-aside doc-scrollbar">
              <DocsSidebar />
            </aside>
            <div className="docs-main-scroll doc-scrollbar">
              <main className="docs-main">{children}</main>
              <DocsFooter />
            </div>
            <aside className="docs-toc-aside doc-scrollbar">
              <DocsToc />
            </aside>
          </div>
        </div>
      </div>
    </DocsTocProvider>
  );
}
