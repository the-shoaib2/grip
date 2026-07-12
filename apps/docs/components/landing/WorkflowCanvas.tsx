export function WorkflowCanvas() {
  return (
    <section className="landing-canvas-section" aria-label="Grip Data Flow Visualization">
      <div className="landing-canvas-wrapper">
        {/* Curved Animated Connector SVGs (Only displayed on desktops) */}
        <svg className="landing-canvas-svg" viewBox="0 0 1000 380" fill="none">
          {/* Path 1: AI to Daemon */}
          <path className="landing-flow-path" d="M 150 190 C 325 190, 325 190, 500 190" />
          <path className="landing-flow-pulse" style={{ "--pulse-color": "#52525b" } as any} d="M 150 190 C 325 190, 325 190, 500 190" />

          {/* Path 2: Daemon to Browser */}
          <path className="landing-flow-path" d="M 500 190 C 675 190, 675 190, 850 190" />
          <path className="landing-flow-pulse" style={{ "--pulse-color": "#52525b" } as any} d="M 500 190 C 675 190, 675 190, 850 190" />
        </svg>

        {/* Node 1: AI Agent / IDE */}
        <div className="flex flex-col items-center gap-4 z-10 relative">
          <div className="relative bg-zinc-950/80 border-2 border-zinc-800 rounded-3xl w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center transition-all hover:border-zinc-600 shadow-xl backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent)]"></div>
            <svg className="relative text-zinc-500 w-8 h-8 sm:w-10 sm:h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
              <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" />
              <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
            </svg>
          </div>
          <span className="text-zinc-400 font-mono text-sm tracking-wide font-medium">ai assistant</span>
        </div>

        {/* Node 2: Go Server */}
        <div className="flex flex-col items-center gap-4 z-10 relative">
          <div className="relative bg-zinc-950/80 border-2 border-zinc-800 rounded-3xl w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center transition-all hover:border-zinc-600 shadow-xl backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent)]"></div>
            <svg className="relative text-zinc-500 w-8 h-8 sm:w-10 sm:h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="8" x="2" y="3" rx="2" />
              <rect width="20" height="8" x="2" y="13" rx="2" />
              <line x1="6" x2="6.01" y1="7" y2="7" />
              <line x1="6" x2="6.01" y1="17" y2="17" />
            </svg>
          </div>
          <span className="text-zinc-400 font-mono text-sm tracking-wide font-medium">grip daemon</span>
        </div>

        {/* Node 3: Target Webpage */}
        <div className="flex flex-col items-center gap-4 z-10 relative">
          <div className="relative bg-zinc-950/80 border-2 border-zinc-800 rounded-3xl w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center transition-all hover:border-zinc-600 shadow-xl backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent)]"></div>
            <svg className="relative text-zinc-500 w-8 h-8 sm:w-10 sm:h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="M6 8h.01" />
              <path d="M10 8h.01" />
              <path d="M14 8h.01" />
            </svg>
          </div>
          <span className="text-zinc-400 font-mono text-sm tracking-wide font-medium">browser</span>
        </div>

      </div>
    </section>
  );
}
