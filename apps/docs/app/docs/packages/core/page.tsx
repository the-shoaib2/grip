import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "overview", title: "What it is", level: 2 as const },
  { id: "exports", title: "Main APIs", level: 2 as const },
  { id: "usage", title: "Run tests", level: 2 as const },
];

export default function CorePackagePage() {
  return (
    <DocPage
      title="grip-dev"
      description="The shared library behind Grip — selectors, accessibility snapshots, pick history, and types used by the extension and MCP stack."
      toc={toc}
    >
      <DocH2 id="overview">What it is</DocH2>
      <p>
        <code>grip-dev</code> is the foundation of the monorepo. It has no UI — just the logic
        other packages import: generating selectors, building accessibility snapshots, storing picks,
        and defining message types between extension parts.
      </p>
      <p>
        If you&apos;re building on Grip or debugging selector behavior, this is the package to
        read.
      </p>

      <DocH2 id="exports">Main APIs</DocH2>
      <ul>
        <li>
          <code>generateSelector</code> — stable CSS selector for a DOM node (via{" "}
          <code>@medv/finder</code>)
        </li>
        <li>
          <code>buildSnapshot</code> — accessibility tree + ref map for agents
        </li>
        <li>
          <code>toStoredPick</code> — serialize a pick for session history
        </li>
        <li>
          <code>GRIP_MCP_DOCS_URL</code> — link opened when you click the yellow MCP chip in the UI
        </li>
      </ul>
      <DocTip>
        Used by <Link href="/docs/packages/devtools">@grip/devtools</Link>, the extension, and the
        playground — change core once, everything stays in sync.
      </DocTip>

      <DocH2 id="usage">Run tests</DocH2>
      <p>Core has unit tests for selectors, snapshots, and history helpers:</p>
      <CodeBlock>{`pnpm --filter grip-dev test`}</CodeBlock>
    </DocPage>
  );
}
