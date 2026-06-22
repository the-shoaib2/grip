import Link from "next/link";

export function DocsFooter() {
  return (
    <footer className="docs-footer">
      <div className="docs-footer-inner">
        <div className="docs-footer-brand">
          <Link href="/" className="docs-footer-logo">
            Grip
          </Link>
          <p className="docs-footer-tagline">Grab anything on the web.</p>
        </div>

        <div className="docs-footer-columns">
          <div>
            <p className="docs-footer-heading">Documentation</p>
            <ul className="docs-footer-links">
              <li>
                <Link href="/docs/getting-started/intro">Introduction</Link>
              </li>
              <li>
                <Link href="/docs/getting-started/quick-start">Quick start</Link>
              </li>
              <li>
                <Link href="/docs/mcp/configuration">MCP configuration</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="docs-footer-heading">Products</p>
            <ul className="docs-footer-links">
              <li>
                <Link href="/docs/extension">Chrome extension</Link>
              </li>
              <li>
                <Link href="/docs/mcp/tools">MCP tools</Link>
              </li>
              <li>
                <Link href="/docs/packages/core">@grip/core</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="docs-footer-heading">Resources</p>
            <ul className="docs-footer-links">
              <li>
                <a href="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noreferrer">
                  Model Context Protocol
                </a>
              </li>
              <li>
                <Link href="/docs/packages/mcp-server">grip-mcp server</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="docs-footer-bottom">
        <p>© {new Date().getFullYear()} Grip. MIT License.</p>
      </div>
    </footer>
  );
}
