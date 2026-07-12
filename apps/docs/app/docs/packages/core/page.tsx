import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";
import { GripDevInstallTabs } from "@components/docs/GripDevInstallTabs";

const toc = [
  { id: "overview", title: "What it is", level: 2 as const },
  { id: "installation", title: "Installation", level: 2 as const },
  { id: "exports", title: "Main APIs", level: 2 as const },
];

export default function CorePackagePage() {
  return (
    <DocPage
      title="grip-dev"
      description="The shared logic foundation for Grip — providing selectors, accessibility snapshots, pick history, and universal types."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        <code>grip-dev</code> contains the fundamental algorithms and types used across the Grip ecosystem. 
        It has no user interface; it acts as the centralized logic hub for generating element selectors, mapping DOM nodes to accessibility trees, and storing interaction history.
      </p>
      <DocTip>
        If you are building custom AI tools or extending Grip's functionality, import utilities directly from this package to ensure compatibility.
      </DocTip>

      <DocH2 id="installation">Installation</DocH2>
      <GripDevInstallTabs />

      <DocH2 id="exports">Main APIs</DocH2>
      <ul>
        <li>
          <code>generateSelector</code> — Calculates a stable CSS selector for any given DOM node.
        </li>
        <li>
          <code>buildSnapshot</code> — Generates an LLM-optimized accessibility tree (AXTree) and reference map for agents to interact with.
        </li>
        <li>
          <code>toStoredPick</code> — Serializes a UI interaction for the global session history.
        </li>
      </ul>
    </DocPage>
  );
}
