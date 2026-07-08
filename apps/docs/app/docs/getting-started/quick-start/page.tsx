import Link from "next/link";
import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH2, DocH3 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { DocTip } from "@components/docs/DocTip";
import { PackageManagerTabs } from "@components/docs/PackageManagerTabs";

const toc = [
  { id: "install", title: "Installation", level: 2 as const },
  { id: "mcp", title: "Run grip then /setup", level: 2 as const },
  { id: "verify", title: "Check it works", level: 2 as const },
];

export default function QuickStartPage() {
  return (
    <DocPage
      title="Quick start"
      description="Get Grip running locally in seconds — install the CLI and connect your favorite AI tool."
      toc={toc}
    >
      <DocH2 id="install">Installation</DocH2>
      <p>Install the CLI using your preferred package manager or directly via our install script:</p>
      <PackageManagerTabs />
      <p>
        When this finishes, you can run <code>grip --help</code> in your terminal to verify the installation.
      </p>



      <DocH2 id="mcp">Run grip then /setup</DocH2>
      <CodeBlock>grip</CodeBlock>
      <p className="mt-4">Then, inside the interactive shell, run:</p>
      <CodeBlock>grip ❯ /setup</CodeBlock>
      <div className="my-6 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900/50">
        <div className="w-full aspect-[16/9] flex items-center justify-center text-zinc-500 font-mono text-sm bg-zinc-950/80">
          [ Placeholder: Screenshot of grip-cli setup interactive UI ]
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-400">
        If you face any issues automatically connecting the MCP server, see the <strong>Manual Configuration</strong> section below.
      </p>

      <DocH3 id="manual-config">Manual Configuration</DocH3>
      <p>
        If you experience any issues with the automatic setup, or your client isn't supported by the setup wizard, add <code>grip-cli</code> to your configuration file manually. Here is a minimal example (works in Cursor and most <code>mcpServers</code> clients):
      </p>
      <CodeBlock>{`{
  "mcpServers": {
    "grip": {
      "command": "grip-cli",
      "args": ["mcp"],
      "env": {
        "GRIP_CHROME_PORT": "9222",
        "GRIP_LOG_LEVEL": "info"
      }
    }
  }
}`}</CodeBlock>
      <p>
        See the full <Link href="/docs/mcp/configuration">MCP configuration guide</Link> for detailed manual setups for other clients like OpenCode and Zed.
      </p>

      <DocH2 id="verify">Check it works</DocH2>
      <p>
        You can use the built-in diagnostic tool to check if the CLI is successfully communicating with your browser:
      </p>
      <CodeBlock>grip</CodeBlock>
      <p className="mt-4">Then run the diagnostic command inside the shell:</p>
      <CodeBlock>grip ❯ /dev</CodeBlock>
      <p>
        This command will ping the browser's CDP port (9222) and display the connection status, confirming the full loop is working.
      </p>
    </DocPage>
  );
}
