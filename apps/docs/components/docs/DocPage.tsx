import type { ReactNode } from "react";
import type { TocItem } from "@lib/types";
import { DocsToc } from "@components/docs/DocsToc";

export interface DocPageProps {
  title: string;
  description?: string;
  toc?: TocItem[];
  children: ReactNode;
}

export function DocPage({ title, description, toc = [], children }: DocPageProps) {
  return (
    <div className="docs-page-grid">
      <article className="doc-article">
        <header className="doc-article-header">
          <h1 className="doc-title">{title}</h1>
          {description ? <p className="doc-lead">{description}</p> : null}
        </header>
        <div className="doc-prose">{children}</div>
      </article>
      <DocsToc items={toc} />
    </div>
  );
}
