import { SiteFooter, SiteHeader } from "@components/site/SiteChrome";
import { Hero } from "@components/landing/Hero";
import { WorkflowCanvas } from "@components/landing/WorkflowCanvas";
import { TerminalDemo } from "@components/landing/TerminalDemo";
import { FeaturesShowcase } from "@components/landing/FeaturesShowcase";
import { IntegrationDetails } from "@components/landing/IntegrationDetails";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-between">
      <div>
        <SiteHeader />
        <main className="max-w-6xl mx-auto border-x border-zinc-900/80 bg-zinc-950/10 min-h-screen">
          <Hero />
          <WorkflowCanvas />
          <TerminalDemo />
          <FeaturesShowcase />
          <IntegrationDetails />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}


