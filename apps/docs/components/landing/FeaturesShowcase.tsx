import Link from "next/link";

export function FeaturesShowcase() {
  return (
    <section className="landing-features-section" aria-label="Monorepo Packages Overview">
      <div className="landing-features-grid">
        <Link href="/docs/packages/core" className="landing-feature-card">
          <div className="landing-feature-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="landing-feature-title">@grip/core</h3>
          <p className="landing-feature-desc">
            The zero-dependency selector generation & accessibility snapshot library. 
            Guarantees fast, robust, and unambiguous element identifiers.
          </p>
        </Link>

        <Link href="/docs/extension" className="landing-feature-card">
          <div className="landing-feature-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
          </div>
          <h3 className="landing-feature-title">@grip/extension</h3>
          <p className="landing-feature-desc">
            Chrome MV3 developer extension featuring interactive selection canvases, 
            devtools inspector pages, session pick histories, and instant clipboard sync.
          </p>
        </Link>

        <Link href="/docs/packages/mcp-server" className="landing-feature-card">
          <div className="landing-feature-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17h16" />
              <path d="M4 12h16" />
              <path d="M4 7h16" />
            </svg>
          </div>
          <h3 className="landing-feature-title">grip-mcp</h3>
          <p className="landing-feature-desc">
            High-performance Go daemon implementing Model Context Protocol tools. 
            Connects command-line AI tools directly to Chrome browser sessions.
          </p>
        </Link>
      </div>
    </section>
  );
}
