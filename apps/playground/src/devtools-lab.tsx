import { render } from "preact";
import { useState } from "preact/hooks";
import {
  CommentField,
  CopyButton,
  ElementTagBadge,
  FieldRow,
  GripPanelView,
  GripPopupView,
  GripRuntimeProvider,
  PickHistoryList,
  SelectDropdown,
  Tooltip,
} from "@grip/devtools";
import { FloatingShell } from "@grip/devtools-floating";
import "@grip/devtools-css";
import "../../../packages/devtools/src/floating/floating.css";
import { playgroundRuntime } from "./mockRuntime";
import "./styles/devtools-lab.css";

type LabView = "popup" | "panel" | "floating" | "components";

function ComponentGallery() {
  return (
    <div class="lab-gallery">
      <section class="lab-block">
        <h3 class="lab-block-title">Pick history</h3>
        <PickHistoryList
          history={[
            {
              id: "1",
              tagName: "button",
              css: "#grip-target",
              xpath: "//button",
              role: "button",
              name: "",
              innerText: "Grip Search",
              rect: { top: 0, left: 0, width: 1, height: 1 },
              shadowDOM: false,
              iframe: "none",
              sessionId: "s1",
              url: "http://localhost:5174/",
              pageTitle: "Playground",
              timestamp: Date.now(),
              label: 'button "Grip Search"',
              comment: "Hero CTA",
            },
          ]}
          activeId="1"
          onSelect={() => {}}
        />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Comment field</h3>
        <CommentField
          value="Pick the [[button]] and describe context"
          onChange={() => {}}
          tagName="button"
          role="button"
          css="#grip-target"
          innerText="Grip Search"
        />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Controls</h3>
        <div class="lab-row">
          <SelectDropdown
            label="Copy as"
            value="mcp"
            options={[
              { value: "mcp", label: "Prompt" },
              { value: "css", label: "CSS" },
            ]}
            onChange={() => {}}
          />
          <CopyButton label="Copy" text="sample prompt" />
        </div>
        <div class="lab-row lab-row-tight">
          <ElementTagBadge tagName="button" role="button" />
          <Tooltip text="Tooltip on hover">
            <span class="grip-chip grip-chip-ok">MCP</span>
          </Tooltip>
        </div>
        <FieldRow label="CSS" value="#grip-target" />
      </section>
    </div>
  );
}

function DevToolsLab() {
  const [view, setView] = useState<LabView>("popup");
  const [floatingOpen, setFloatingOpen] = useState(true);

  return (
    <GripRuntimeProvider runtime={playgroundRuntime}>
      <div class="lab-shell">
        <header class="lab-header">
          <div class="lab-header-brand">
            <h1>Grip DevTools UI Lab</h1>
            <p>Hot-reload Preact views without loading the extension.</p>
          </div>
          <nav class="lab-nav" aria-label="Views">
            {(
              [
                ["popup", "Popup"],
                ["panel", "Panel"],
                ["floating", "Floating"],
                ["components", "Components"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                class={`lab-nav-btn${view === id ? " lab-nav-active" : ""}`}
                onClick={() => setView(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <a class="lab-back" href="/">
            ← Fixture page
          </a>
        </header>

        <main class="lab-main">
          {view === "popup" && (
            <div class="lab-preview lab-preview-popup">
              <GripPopupView />
            </div>
          )}
          {view === "panel" && (
            <div class="lab-preview lab-preview-panel">
              <GripPanelView />
            </div>
          )}
          {view === "floating" && (
            <div class="lab-preview-floating-stage">
              <FloatingShell
                open={floatingOpen}
                onToggle={() => setFloatingOpen((open) => !open)}
              >
                <GripPanelView
                  layout="floating"
                  onMinimize={() => setFloatingOpen(false)}
                />
              </FloatingShell>
            </div>
          )}
          {view === "components" && <ComponentGallery />}
        </main>
      </div>
    </GripRuntimeProvider>
  );
}

render(<DevToolsLab />, document.getElementById("app")!);
