export function WorkflowCanvas() {
  return (
    <section className="landing-canvas-section" aria-label="Grip Data Flow Visualization">
      <div className="landing-canvas-wrapper">
        {/* Curved Animated Connector SVGs (Only displayed on desktops) */}
        <svg className="landing-canvas-svg" viewBox="0 0 1000 380" fill="none">
          {/* Path 1: DOM to Extension */}
          <path className="landing-flow-path" d="M 90 190 C 225 190, 225 190, 360 190" />
          <path className="landing-flow-pulse" style={{ "--pulse-color": "#10b981" } as any} d="M 90 190 C 225 190, 225 190, 360 190" />

          {/* Path 2: Extension to Server */}
          <path className="landing-flow-path" d="M 360 190 C 500 190, 500 190, 640 190" />
          <path className="landing-flow-pulse" style={{ "--pulse-color": "#3b82f6" } as any} d="M 360 190 C 500 190, 500 190, 640 190" />

          {/* Path 3: Server to Agent */}
          <path className="landing-flow-path" d="M 640 190 C 775 190, 775 190, 910 190" />
          <path className="landing-flow-pulse" style={{ "--pulse-color": "#8b5cf6" } as any} d="M 640 190 C 775 190, 775 190, 910 190" />
        </svg>

        {/* Node 1: Target Webpage */}
        <div className="landing-node node-dom">
          <div className="landing-node-card node-gravity-1">
            <div className="landing-node-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="M6 8h.01" />
                <path d="M10 8h.01" />
                <path d="M14 8h.01" />
              </svg>
            </div>
            <span className="landing-node-title">Target Webpage</span>
            <span className="landing-node-tag">Browser Node</span>
            <p className="landing-node-details">Inspects properties, state variables, and DOM components.</p>
          </div>
        </div>

        {/* Node 2: Extension */}
        <div className="landing-node node-ext">
          <div className="landing-node-card node-gravity-2">
            <div className="landing-node-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <span className="landing-node-title">@grip/extension</span>
            <span className="landing-node-tag">Chrome Extension</span>
            <p className="landing-node-details">Visual element picker overlay and DevTools inspector panels.</p>
          </div>
        </div>

        {/* Node 3: Go Server */}
        <div className="landing-node node-mcp">
          <div className="landing-node-card node-gravity-3">
            <div className="landing-node-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="8" x="2" y="3" rx="2" />
                <rect width="20" height="8" x="2" y="13" rx="2" />
                <line x1="6" x2="6.01" y1="7" y2="7" />
                <line x1="6" x2="6.01" y1="17" y2="17" />
              </svg>
            </div>
            <span className="landing-node-title">grip-mcp</span>
            <span className="landing-node-tag">Go Server</span>
            <p className="landing-node-details">Connects over CDP to execute browser queries & clicks.</p>
          </div>
        </div>

        {/* Node 4: AI Agent / IDE */}
        <div className="landing-node node-agent">
          <div className="landing-node-card node-gravity-4">
            <div className="landing-node-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
                <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" />
                <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
              </svg>
            </div>
            <span className="landing-node-title">AI Client / IDE</span>
            <span className="landing-node-tag">MCP Consumer</span>
            <p className="landing-node-details">Reads layouts, fills values, and applies precise codebase edits.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
