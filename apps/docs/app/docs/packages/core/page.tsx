import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "exports", title: "Key exports", level: 2 as const },
  { id: "usage", title: "Usage", level: 2 as const },
];

export default function CorePackagePage() {
  return (
    <DocPage
      title="@grip/core"
      description="Zero-dependency selector generation, accessibility snapshots, ref maps, and pick history types."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        <code>@grip/core</code> is the shared foundation for Grip. It generates stable CSS selectors,
        builds accessibility snapshots compatible with MCP output, serializes picks for storage, and
        defines extension IPC message types.
      </p>

      <DocH2 id="exports">Key exports</DocH2>
      <ul>
        <li>
          <code>generateSelector</code> — CSS selector from DOM node (<code>@medv/finder</code>)
        </li>
        <li>
          <code>buildSnapshot</code> / ref map utilities — accessibility tree for agents
        </li>
        <li>
          <code>toStoredPick</code>, pick history helpers — session persistence
        </li>
        <li>
          <code>GRIP_MCP_DOCS_URL</code> — link opened from MCP setup chip in UI
        </li>
      </ul>

      <DocH2 id="usage">Usage</DocH2>
      <p>
        Imported by <code>@grip/devtools</code>, <code>@grip/extension</code>, and the playground.
        Run tests with:
      </p>
      <pre className="doc-code">
        <code>pnpm --filter @grip/core test</code>
      </pre>
    </DocPage>
  );
}
