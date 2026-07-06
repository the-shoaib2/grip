import Link from "next/link";

export function IntegrationDetails() {
  return (
    <section className="landing-terminal-section" style={{ paddingTop: "0", paddingBottom: "6rem" }}>
      <div className="landing-section-header" style={{ marginBottom: "4rem" }}>
        <h2 className="landing-section-title">Integration Architecture</h2>
        <p className="landing-section-desc">
          How Grip bridges the gap between active browser windows and LLM workspaces.
        </p>
      </div>

      <div className="landing-features-grid" style={{ width: "100%" }}>
        <div className="landing-feature-card">
          <h3 className="landing-feature-title" style={{ fontSize: "1rem" }}>
            1. Front-End Content Scripts
          </h3>
          <p className="landing-feature-desc" style={{ marginTop: "0.5rem" }}>
            Injects active listeners into target webpages. Detects React components by reading internal fiber pointers, allowing extraction of component props and visual states.
          </p>
        </div>

        <div className="landing-feature-card">
          <h3 className="landing-feature-title" style={{ fontSize: "1rem" }}>
            2. Chrome DevTools APIs
          </h3>
          <p className="landing-feature-desc" style={{ marginTop: "0.5rem" }}>
            Leverages elevated browser privileges inside DevTools panels. Resolves JS source maps on-the-fly to trace DOM coordinates back to original local repository files and line numbers.
          </p>
        </div>

        <div className="landing-feature-card">
          <h3 className="landing-feature-title" style={{ fontSize: "1rem" }}>
            3. Go Background Daemon
          </h3>
          <p className="landing-feature-desc" style={{ marginTop: "0.5rem" }}>
            Communicates with host IDE agents via standard input/output (`stdio`) or HTTP endpoints. Safely forwards LLM actions (clicks, keypresses, screenshot requests) directly to target tabs.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "3.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--doc-muted)", fontSize: "0.875rem" }}>
          Ready to plug it in? Check out the complete config reference.
        </p>
        <Link href="/docs/mcp/configuration" className="landing-cta landing-cta-secondary" style={{ marginTop: "1rem" }}>
          Read MCP Docs
        </Link>
      </div>
    </section>
  );
}
