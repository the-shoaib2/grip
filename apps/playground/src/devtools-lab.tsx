import { render } from "preact";
import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import type { StoredPick } from "@grip/core";
import {
  ContextEditorPanel,
  CopyButton,
  ElementTagBadge,
  FieldRow,
  GripPanelView,
  GripPopupView,
  GripRuntimeProvider,
  PickHistoryList,
  SessionHistoryList,
  SessionPickComposer,
  SelectDropdown,
  Tooltip,
  usePageContextEditor,
  usePickHistory,
} from "@grip/devtools";
import { FloatingShell } from "@grip/devtools-floating";
import "@grip/devtools-css";
import "../../../packages/devtools/src/floating/floating.css";
import { playgroundRuntime } from "./mockRuntime";
import "./styles/devtools-lab.css";

type LabView = "popup" | "panel" | "floating" | "components";

function CommentFieldSection({
  pick,
  onClose,
}: {
  pick: StoredPick | null;
  onClose: () => void;
}) {
  const { savePickComment, selectPick } = usePickHistory();

  if (!pick) {
    return (
      <p class="grip-empty-state">
        Pick an element or click context in the shell, then confirm to create or edit here.
      </p>
    );
  }

  return (
    <ContextEditorPanel
      pick={pick}
      onClose={onClose}
      onSave={(comment) => savePickComment(pick.id, comment)}
      onNavigate={selectPick}
    />
  );
}

function PickHistoryLabDemo({
  onContextEditRequest,
}: {
  onContextEditRequest?: (
    pick: StoredPick,
    meta: { pickIndex: number; pickCount: number },
  ) => void;
}) {
  const [historyView, setHistoryView] = useState(false);
  const {
    history,
    sessionGroups,
    activeSessionId,
    activePick,
    selectPick,
    savePickComment,
    deleteSession,
    switchSession,
  } = usePickHistory();

  return (
    <div class="lab-history-demo">
      <div class="lab-history-demo-toggle">
        <button
          type="button"
          class={`lab-nav-btn${!historyView ? " lab-nav-active" : ""}`}
          onClick={() => setHistoryView(false)}
        >
          Session
        </button>
        <button
          type="button"
          class={`lab-nav-btn${historyView ? " lab-nav-active" : ""}`}
          onClick={() => setHistoryView(true)}
        >
          All sessions
        </button>
      </div>
      {historyView ? (
        <SessionHistoryList
          groups={sessionGroups}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            void switchSession(id);
            setHistoryView(false);
          }}
          onDeleteSession={(id) => void deleteSession(id)}
        />
      ) : (
        <div class="grip-session-stack">
          {activePick ? (
            <SessionPickComposer
              pick={activePick}
              pickIndex={history.findIndex((p) => p.id === activePick.id) + 1}
              pickCount={history.length}
              onCommentChange={(comment) => savePickComment(activePick.id, comment)}
              onNavigate={selectPick}
              onEditRequest={onContextEditRequest}
            />
          ) : (
            <p class="grip-empty-state">No picks yet</p>
          )}
          <PickHistoryList
            history={history}
            activeId={activePick?.id}
            activeSessionId={activeSessionId}
            onSelect={selectPick}
            compact
          />
        </div>
      )}
    </div>
  );
}

function LabShellWorkspace({
  children,
  editorPick,
  onCloseEditor,
}: {
  children: ComponentChildren;
  editorPick: StoredPick | null;
  onCloseEditor: () => void;
}) {
  return (
    <div class="lab-shell-workspace">
      {children}
      <section
        class="lab-block lab-context-editor-block"
      >
        <h3 class="lab-block-title">Comment field</h3>
        <CommentFieldSection pick={editorPick} onClose={onCloseEditor} />
      </section>
    </div>
  );
}

function ComponentGallery({
  editorPick,
  onContextEditRequest,
  onCloseEditor,
}: {
  editorPick: StoredPick | null;
  onContextEditRequest: (
    pick: StoredPick,
    meta: { pickIndex: number; pickCount: number },
  ) => void;
  onCloseEditor: () => void;
}) {
  return (
    <div class="lab-gallery">
      <section class="lab-block">
        <h3 class="lab-block-title">Pick history</h3>
        <PickHistoryLabDemo onContextEditRequest={onContextEditRequest} />
      </section>

      <section class="lab-block lab-context-editor-block">
        <h3 class="lab-block-title">Comment field</h3>
        <CommentFieldSection pick={editorPick} onClose={onCloseEditor} />
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

function DevToolsLabContent() {
  const [view, setView] = useState<LabView>("popup");
  const [floatingOpen, setFloatingOpen] = useState(true);
  const [editorPick, setEditorPick] = useState<StoredPick | null>(null);
  const openPageContextEditor = usePageContextEditor();

  const openContextEditor = (pick: StoredPick) => {
    setEditorPick(pick);
  };

  return (
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
            <LabShellWorkspace
              editorPick={editorPick}
              onCloseEditor={() => setEditorPick(null)}
            >
              <div class="lab-preview lab-preview-popup">
                <GripPopupView onContextEditRequest={openContextEditor} />
              </div>
            </LabShellWorkspace>
          )}
          {view === "panel" && (
            <LabShellWorkspace
              editorPick={editorPick}
              onCloseEditor={() => setEditorPick(null)}
            >
              <div class="lab-preview lab-preview-panel">
                <GripPanelView onContextEditRequest={openContextEditor} />
              </div>
            </LabShellWorkspace>
          )}
          {view === "floating" && (
            <LabShellWorkspace
              editorPick={editorPick}
              onCloseEditor={() => setEditorPick(null)}
            >
              <div class="lab-preview-floating-stage">
                <FloatingShell
                  open={floatingOpen}
                  onToggle={() => setFloatingOpen((open) => !open)}
                >
                  <GripPanelView
                    layout="floating"
                    onMinimize={() => setFloatingOpen(false)}
                    onContextEditRequest={openPageContextEditor}
                  />
                </FloatingShell>
              </div>
            </LabShellWorkspace>
          )}
          {view === "components" && (
            <ComponentGallery
              editorPick={editorPick}
              onContextEditRequest={openContextEditor}
              onCloseEditor={() => setEditorPick(null)}
            />
          )}
        </main>
      </div>
  );
}

function DevToolsLab() {
  return (
    <GripRuntimeProvider runtime={playgroundRuntime}>
      <DevToolsLabContent />
    </GripRuntimeProvider>
  );
}

render(<DevToolsLab />, document.getElementById("app")!);
