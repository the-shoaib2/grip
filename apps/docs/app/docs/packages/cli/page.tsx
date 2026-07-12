import { DocH2 } from "@components/docs/DocHeading";
import { DocPage } from "@components/docs/DocPage";
import { PackageManagerTabs } from "@components/docs/PackageManagerTabs";

const toc = [
  { id: "overview", title: "Overview", level: 2 as const },
  { id: "installation", title: "Installation", level: 2 as const },
  { id: "commands", title: "Commands", level: 2 as const },
];

export default function CliPackagePage() {
  return (
    <DocPage
      title="@grip/cli"
      description="The standalone command-line interface for Grip. Provides an interactive shell, daemon management, and MCP server configuration."
      toc={toc}
    >
      <DocH2 id="overview">Overview</DocH2>
      <p>
        <code>@grip/cli</code> (published as <code>grip-cli</code>) is the primary entry point for most users. 
        It is a fast, standalone binary compiled via <code>tsup</code> and <code>esbuild</code>. It does not require Node.js 
        to be installed on the host machine.
      </p>

      <DocH2 id="installation">Installation</DocH2>
      <PackageManagerTabs />

      <DocH2 id="commands">Commands</DocH2>
      <p>
        The CLI features a beautiful interactive shell built with <code>@clack/prompts</code>. Running <code>grip</code> without any arguments will drop you into this shell.
      </p>
      <ul>
        <li>
          <code>grip start</code> / <code>/start</code>: Starts the background MCP daemon.
        </li>
        <li>
          <code>grip stop</code> / <code>/stop</code>: Stops the background daemon.
        </li>
        <li>
          <code>grip status</code> / <code>/status</code>: Checks the daemon status.
        </li>
        <li>
          <code>grip setup</code> / <code>/setup</code>: Interactive wizard to automatically configure AI IDEs.
        </li>
        <li>
          <code>grip mcp</code> / <code>/mcp</code>: Runs the stdio MCP server (used by AI clients).
        </li>
        <li>
          <code>grip dev</code> / <code>/dev</code>: Diagnostic tool to verify CDP browser connectivity.
        </li>
      </ul>
    </DocPage>
  );
}
