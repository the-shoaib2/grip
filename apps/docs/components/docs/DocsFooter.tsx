import Link from "next/link";
import { Logo } from "@components/landing/Logo";

export function DocsFooter() {
  return (
    <footer className="docs-footer">
      <div className="docs-footer-inner">
        <div className="docs-footer-brand">
          <Link href="/" className="docs-footer-logo">
            <Logo />
          </Link>
          <p className="docs-footer-tagline">connect ai assistants to your live web browser via mcp.</p>
        </div>

        <div className="docs-footer-columns">
          <div>
            <p className="docs-footer-heading">documentation</p>
            <ul className="docs-footer-links">
              <li>
                <Link href="/docs/getting-started/intro">introduction</Link>
              </li>
              <li>
                <Link href="/docs/getting-started/quick-start">quick start</Link>
              </li>
              <li>
                <Link href="/docs/mcp/configuration">mcp configuration</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="docs-footer-heading">products</p>
            <ul className="docs-footer-links">
              <li>
                <Link href="/docs/extension">chrome extension</Link>
              </li>
              <li>
                <Link href="/docs/mcp/tools">mcp tools</Link>
              </li>
              <li>
                <Link href="/docs/packages/core">@grip/core</Link>
              </li>
              <li>
                <Link href="/docs/packages/cli">@grip/cli</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="docs-footer-heading">resources</p>
            <ul className="docs-footer-links">
              <li>
                <a href="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noreferrer">
                  model context protocol
                </a>
              </li>
              <li>
                <Link href="/docs/packages/devtools">@grip/devtools</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="docs-footer-bottom flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} grip. mit license.</p>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span>developed by</span>
          <a href="https://theshoaib.me" target="_blank" rel="noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="https://avatars.githubusercontent.com/u/125272364?v=4" 
              alt="theshoaib" 
              className="w-6 h-6 rounded-full border border-zinc-700" 
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
