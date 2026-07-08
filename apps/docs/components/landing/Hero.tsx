import Link from "next/link";
import { InstallCommand } from "./InstallCommand";

export function Hero() {
  return (
    <section className="relative w-full py-20 px-6 flex flex-col items-center justify-center text-center overflow-hidden border-b border-zinc-900 bg-zinc-950/20">
      {/* Background grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />


      {/* Hero Headings */}
      <h1 className="relative z-10 max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
        Grip on anything on the web. <br />
      </h1>

      {/* Hero CTA Actions */}
      <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/docs/getting-started/intro"
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200"
        >
          Get Started
        </Link>
        <Link
          href="/docs/mcp/configuration"
          className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 px-6 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-900 hover:border-zinc-700"
        >
          Configure MCP
        </Link>
      </div>

      <InstallCommand />
    </section>
  );
}
