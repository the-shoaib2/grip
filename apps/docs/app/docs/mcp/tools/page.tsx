import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";

const tools = [
  {
    name: "snapshot",
    description: "Get the full accessibility tree and ref map of the current page.",
  },
  {
    name: "highlight",
    description: "Draw a visible blue overlay on the element for confirmation.",
  },
  {
    name: "click",
    description: "Click an element by accessibility ref.",
  },
  {
    name: "fill",
    description: "Type into an input or textarea by ref.",
  },
  {
    name: "read_logs",
    description: "Returns buffered console output from the page.",
  },
  {
    name: "read_network",
    description: "Returns recent network requests as HAR entries.",
  },
  {
    name: "screenshot",
    description: "Capture a screenshot of the full page or a specific element.",
  },
  {
    name: "pick_element",
    description: "Activate the visual element picker; returns metadata after user click.",
  },
  {
    name: "navigate",
    description: "Navigate to a URL and invalidate stale refs.",
  },
  {
    name: "eval",
    description: "Run Runtime.evaluate in the page context.",
  },
];

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "tools", title: "Available tools", level: 2 as const },
  { id: "workflow", title: "Recommended workflow", level: 2 as const },
];

export default function McpToolsPage() {
  return (
    <DocPage
      title="MCP tools reference"
      description="Tools exposed by grip-mcp for AI agents and MCP clients."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        All tools are registered by <code>grip-mcp</code> and operate on the browser tab attached
        via Chrome DevTools Protocol. Refs from <code>snapshot</code> expire after navigation — always
        re-snapshot before acting on a new page state.
      </p>

      <DocH2 id="tools">Available tools</DocH2>
      <div className="doc-tool-list">
        {tools.map((tool) => (
          <div key={tool.name} className="doc-tool-item">
            <code className="doc-tool-name">{tool.name}()</code>
            <p>{tool.description}</p>
          </div>
        ))}
      </div>

      <DocH2 id="workflow">Recommended workflow</DocH2>
      <ol>
        <li>
          Call <code>snapshot()</code> after page load or navigation.
        </li>
        <li>
          Use <code>highlight(ref)</code> to confirm the target element.
        </li>
        <li>
          Call <code>click(ref)</code> or <code>fill(ref, value)</code> as needed.
        </li>
        <li>
          Call <code>read_logs()</code> and <code>read_network()</code> to verify side effects.
        </li>
        <li>
          Re-snapshot after any navigation or major DOM change.
        </li>
      </ol>
    </DocPage>
  );
}
