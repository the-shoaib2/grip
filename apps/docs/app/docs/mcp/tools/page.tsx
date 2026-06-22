import Link from "next/link";
import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const tools = [
  {
    name: "snapshot",
    description: "Read the page accessibility tree and get refs you can use in other tools.",
    when: "After every page load or navigation.",
  },
  {
    name: "highlight",
    description: "Draw a blue outline on an element so you can confirm the right target.",
    when: "Before click or fill, especially when debugging agents.",
  },
  {
    name: "click",
    description: "Click a button, link, or control by its ref from snapshot.",
    when: "When you need to submit, navigate, or toggle UI.",
  },
  {
    name: "fill",
    description: "Type text into an input or textarea.",
    when: "Forms, search boxes, login fields.",
  },
  {
    name: "read_logs",
    description: "Read console output the page has written (errors, warnings, logs).",
    when: "After an action to see if something broke.",
  },
  {
    name: "read_network",
    description: "List recent network requests as HAR-style entries.",
    when: "Debugging API calls or failed fetches.",
  },
  {
    name: "screenshot",
    description: "Capture the full page or a single element as an image.",
    when: "Visual verification or sharing state with a user.",
  },
  {
    name: "pick_element",
    description: "Turn on the visual picker — you click an element, Grip returns its metadata.",
    when: "When you need human-in-the-loop element selection.",
  },
  {
    name: "navigate",
    description: "Go to a URL. All previous refs become invalid after navigation.",
    when: "Moving to a new page in a flow.",
  },
  {
    name: "eval",
    description: "Run JavaScript in the page context via Runtime.evaluate.",
    when: "Advanced cases not covered by click/fill.",
  },
];

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "tools", title: "Tool reference", level: 2 as const },
  { id: "workflow", title: "Suggested workflow", level: 2 as const },
];

export default function McpToolsPage() {
  return (
    <DocPage
      title="MCP tools reference"
      description="What each grip-mcp tool does, when to use it, and a simple workflow that keeps agents out of trouble."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        These tools are exposed by <code>grip-mcp</code> to any MCP client. They operate on the Chrome
        tab attached through DevTools Protocol.
      </p>
      <DocTip>
        Refs from <code>snapshot</code> expire when the page navigates or changes heavily. Always
        snapshot again before clicking or filling on a new page state.
      </DocTip>
      <p>
        Not set up yet? Start with the{" "}
        <Link href="/docs/mcp/configuration">MCP configuration guide</Link>.
      </p>

      <DocH2 id="tools">Tool reference</DocH2>
      <div className="doc-tool-list">
        {tools.map((tool) => (
          <div key={tool.name} className="doc-tool-item">
            <code className="doc-tool-name">{tool.name}()</code>
            <p>{tool.description}</p>
            <p className="doc-tool-when">
              <strong>When to use:</strong> {tool.when}
            </p>
          </div>
        ))}
      </div>

      <DocH2 id="workflow">Suggested workflow</DocH2>
      <p>A reliable pattern for agents (and humans driving MCP manually):</p>
      <ol>
        <li>
          <code>snapshot()</code> — see what&apos;s on the page
        </li>
        <li>
          <code>highlight(ref)</code> — confirm the target
        </li>
        <li>
          <code>click(ref)</code> or <code>fill(ref, value)</code> — act
        </li>
        <li>
          <code>read_logs()</code> / <code>read_network()</code> — check for errors
        </li>
        <li>
          Snapshot again after navigation or big DOM changes
        </li>
      </ol>
    </DocPage>
  );
}
