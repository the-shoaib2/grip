import { SiteFooter, SiteHeader } from "@components/site/SiteChrome";
import { Hero } from "@components/landing/Hero";
import { WorkflowCanvas } from "@components/landing/WorkflowCanvas";
import { TerminalDemo } from "@components/landing/TerminalDemo";
import { FeaturesShowcase } from "@components/landing/FeaturesShowcase";
import { IntegrationDetails } from "@components/landing/IntegrationDetails";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="landing-main">
        <Hero />
        <WorkflowCanvas />
        <TerminalDemo />
        <FeaturesShowcase />
        <IntegrationDetails />
      </main>
      <SiteFooter />
    </>
  );
}


