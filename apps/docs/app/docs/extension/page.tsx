import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "install", title: "Installation", level: 2 as const },
  { id: "surfaces", title: "Usage Modes", level: 2 as const },
];

export default function ExtensionPage() {
  return (
    <DocPage
      title="Chrome extension"
      description="Visually pick elements, view your history, and share exact UI context directly with your AI assistant."
      toc={toc}
    >
      <div className="my-8 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900/50 aspect-video flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent"></div>
        <svg className="w-16 h-16 text-zinc-700 mb-4 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-zinc-500 font-medium z-10">Extension Screenshot Placeholder</span>
      </div>

      <DocH2 id="overview">Overview</DocH2>
      <p>
        The Grip extension enhances your Chrome browser with a visual element picker, session history, and an MCP status badge. It acts as the visual frontend for the Grip CLI, allowing you to seamlessly share exactly what you are seeing with your AI IDE.
      </p>
      <ul>
        <li>
          <strong>Visual Picking</strong>: Click any element to automatically extract robust CSS selectors and copy its context.
        </li>
        <li>
          <strong>Session History</strong>: View a running log of everything you and your AI have interacted with during the session.
        </li>
        <li>
          <strong>Status Badge</strong>: Instantly know when your browser is actively connected to an MCP tool.
        </li>
      </ul>

      <DocH2 id="install">Installation</DocH2>
      <p>Build the extension bundle locally:</p>
      <CodeBlock>{`pnpm --filter @grip/extension build`}</CodeBlock>
      <p>Load it in Chrome:</p>
      <ol>
        <li>
          Open <code>chrome://extensions</code>
        </li>
        <li>
          Enable <strong>Developer mode</strong> (top right)
        </li>
        <li>
          Click <strong>Load unpacked</strong> → select the <code>packages/extension/dist</code> directory
        </li>
      </ol>
      <DocTip>
        For active development, run <code>pnpm --filter @grip/extension dev</code> and click the reload icon on the extension card when you make changes.
      </DocTip>

      <DocH2 id="surfaces">Usage Modes</DocH2>
      <p>Grip provides three distinct ways to interact with the extension UI, depending on your workflow:</p>
      <ul>
        <li>
          <strong>Popup</strong> — Click the Grip icon in the Chrome toolbar. Compact and quick; ideal for a single quick interaction.
        </li>
        <li>
          <strong>DevTools Panel</strong> — Open Chrome DevTools and switch to the Grip panel. Best for persistent debugging, as it stays open alongside your console and network tabs.
        </li>
        <li>
          <strong>Floating Tray</strong> — A small, unobtrusive button injected directly into the bottom-right of the web page. Expands into a full panel without needing to open DevTools.
        </li>
      </ul>
    </DocPage>
  );
}
