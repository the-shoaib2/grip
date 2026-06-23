import { render } from "preact";
import { useMemo, useState } from "preact/hooks";
import { gripChipToken, newChipId } from "@grip/core";
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
  useGripRuntime,
  usePickHistory,
  type InlineChipRef,
} from "@grip/devtools";
import { FloatingShell } from "@grip/devtools-floating";
import "@grip/devtools-css";
import "../../../packages/devtools/src/floating/floating.css";
import { playgroundRuntime } from "./mockRuntime";
import "./styles/devtools-lab.css";

type LabView = "popup" | "panel" | "floating" | "components";

const DEMO_ELEMENT: Omit<InlineChipRef, "id"> = {
  tag: "button",
  role: "button",
  css: "#grip-target",
  xpath: "//button[@id='grip-target']",
  text: "Grip Search",
  name: "",
  rect: { top: 0, left: 0, width: 120, height: 40 },
  shadowDOM: false,
  iframe: "none",
};

function CommentFieldLabDemo() {
  const chipId = useMemo(() => newChipId(), []);
  const chips = useMemo<InlineChipRef[]>(
    () => [{ id: chipId, ...DEMO_ELEMENT }],
    [chipId],
  );
  const [comment, setComment] = useState(
    () => `Pick the ${gripChipToken(chipId)} and describe context`,
  );

  return (
    <CommentField
      chips={chips}
      value={comment}
      onChange={setComment}
      placeholder="Select elements on the page, then describe what you need…"
    />
  );
}

function PickHistoryLabDemo() {
  const runtime = useGripRuntime();
  const { history, activePick, selectPick, deletePick } = usePickHistory(runtime);

  return (
    <PickHistoryList
      history={history}
      activeId={activePick?.id}
      onSelect={selectPick}
      onDelete={(pick) => void deletePick(pick)}
    />
  );
}

function ComponentGallery() {
  return (
    <div class="lab-gallery">
      <section class="lab-block">
        <h3 class="lab-block-title">Pick history</h3>
        <PickHistoryLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Comment field</h3>
        <CommentFieldLabDemo />
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
