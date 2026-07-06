import Link from "next/link";

export function Hero() {
  return (
    <section className="landing-hero">
      <h1 className="landing-hero-title">Grip</h1>
      <p className="landing-hero-sub">Grab anything on the web.</p>
      <p className="landing-hero-desc">
        Open-source browser element selector, accessibility inspector, log reader,
        and AI agent browser interface. Inspect visual state, extract clean DOM contexts, 
        and feed them directly to IDE Agents.
      </p>
      <div className="landing-hero-actions">
        <Link href="/docs/getting-started/intro" className="landing-cta landing-cta-primary">
          Get Started
        </Link>
        <Link href="/docs/mcp/configuration" className="landing-cta landing-cta-secondary">
          Configure MCP
        </Link>
      </div>
    </section>
  );
}
