import { render } from "preact";
import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { composerStateForStoredPick, type StoredPick } from "@grip/core";
import {
  CommentField,
  ContextEditorPanel,
  CopyButton,
  ElementTagBadge,
  FieldRow,
  GripBrand,
  GripContextEditorHost,
  GripMcpChip,
  GripPanelView,
  GripPopupView,
  GripRootLayout,
  GripRuntimeProvider,
  GripSessionToolbar,
  GripShellDialog,
  HistoryIcon,
  LogPanel,
  McpIcon,
  MinusIcon,
  MousePointerClickIcon,
  PickErrorBanner,
  PickHistoryList,
  PlusIcon,
  SessionHistoryList,
  SessionLabel,
  SessionPickComposer,
  SelectDropdown,
  Tooltip,
  UndoIcon,
  useGripStore,
  usePageContextEditor,
  usePickHistory,
} from "@grip/devtools";
import { FloatingShell } from "@grip/devtools-floating";
import "@grip/devtools-css";
import "../../../packages/devtools/src/floating/floating.css";
import { playgroundRuntime } from "./mockRuntime";
import { registerTrayHandler } from "./trayBridge";
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
    deletePick,
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
              onDeletePick={() => void deletePick(activePick.id)}
            />
          ) : (
            <p class="grip-empty-state">No picks yet</p>
          )}
          <PickHistoryList
            history={history}
            activeId={activePick?.id}
            activeSessionId={activeSessionId}
            onSelect={selectPick}
            onDeletePick={(pick) => void deletePick(pick.id)}
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
  narrow = false,
}: {
  children: ComponentChildren;
  editorPick: StoredPick | null;
  onCloseEditor: () => void;
  narrow?: boolean;
}) {
  return (
    <div class={`lab-shell-workspace${narrow ? " lab-shell-workspace-narrow" : ""}`}>
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

function LogsLabDemo() {
  const addLog = useGripStore((s) => s.addLog);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || useGripStore.getState().logs.length > 0) return;
    seeded.current = true;
    const now = Date.now();
    addLog({ level: "info", message: "Grip lab initialized", timestamp: now });
    addLog({ level: "warn", message: "Sample warning from fixture page", timestamp: now + 1 });
    addLog({ level: "error", message: "Sample error for styling preview", timestamp: now + 2 });
  }, [addLog]);

  return <LogPanel />;
}

function CommentFieldLabDemo() {
  const { activePick } = usePickHistory();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!activePick) {
      setValue("");
      return;
    }
    setValue(composerStateForStoredPick(activePick).comment);
  }, [activePick?.id, activePick?.comment]);

  if (!activePick) {
    return <p class="grip-empty-state">Select a pick in history to preview CommentField.</p>;
  }

  const { chips } = composerStateForStoredPick(activePick);

  return (
    <CommentField
      chips={chips}
      value={value}
      onChange={setValue}
      placeholder="Describe what you need…"
    />
  );
}

function DialogLabDemo() {
  const [open, setOpen] = useState(false);

  return (
    <GripRootLayout variant="popup" className="lab-dialog-preview">
      <button type="button" class="grip-btn-secondary" onClick={() => setOpen(true)}>
        Open confirm dialog
      </button>
      <GripShellDialog
        open={open}
        title="Edit context?"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      >
        <p class="grip-shell-dialog-lead">
          Open the comment panel on the page to edit this pick&apos;s context.
        </p>
      </GripShellDialog>
    </GripRootLayout>
  );
}

function ToolbarLabDemo() {
  const [pickActive, setPickActive] = useState(false);
  const [historyView, setHistoryView] = useState(false);

  return (
    <GripSessionToolbar
      variant="popup"
      pickActive={pickActive}
      historyView={historyView}
      onPick={() => setPickActive((active) => !active)}
      onToggleHistoryView={() => setHistoryView((open) => !open)}
      onNewSession={() => {
        setHistoryView(false);
        setPickActive(false);
      }}
    />
  );
}

function ContextEditorHostLabDemo() {
  const { activePick, history } = usePickHistory();

  return (
    <GripContextEditorHost>
      {(openEditor) => (
        <div class="lab-host-actions">
          <button
            type="button"
            class="grip-btn-secondary"
            disabled={!activePick}
            onClick={() => {
              if (!activePick) return;
              const pickIndex = history.findIndex((pick) => pick.id === activePick.id) + 1;
              openEditor(activePick, { pickIndex, pickCount: history.length });
            }}
          >
            Open via GripContextEditorHost
          </button>
        </div>
      )}
    </GripContextEditorHost>
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
  const [mcpConnected, setMcpConnected] = useState(true);
  const { history } = usePickHistory();

  return (
    <div class="lab-gallery">
      <section class="lab-block">
        <h3 class="lab-block-title">Brand &amp; status</h3>
        <div class="lab-row lab-row-tight">
          <GripBrand />
          <SessionLabel pickCount={history.length || 1} current />
          <GripMcpChip connected={mcpConnected} onConfigure={() => setMcpConnected(true)} />
          <button type="button" class="lab-nav-btn" onClick={() => setMcpConnected((on) => !on)}>
            Toggle MCP
          </button>
        </div>
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Session toolbar</h3>
        <ToolbarLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Pick error banner</h3>
        <PickErrorBanner message="Could not reach the page picker." onRetry={() => {}} />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Confirm dialog</h3>
        <DialogLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Session &amp; pick history</h3>
        <PickHistoryLabDemo onContextEditRequest={onContextEditRequest} />
      </section>

      <section class="lab-block lab-context-editor-block">
        <h3 class="lab-block-title">Context editor panel</h3>
        <CommentFieldSection pick={editorPick} onClose={onCloseEditor} />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Comment field</h3>
        <CommentFieldLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Context editor host</h3>
        <ContextEditorHostLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Console log panel</h3>
        <LogsLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Controls &amp; fields</h3>
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
          <CopyButton label="Copy" text="sample prompt" variant="ghost" size="icon" tooltip="Copy icon" />
        </div>
        <div class="lab-row lab-row-tight">
          <ElementTagBadge tagName="button" role="button" />
          <ElementTagBadge tagName="input" role="searchbox" />
          <Tooltip text="Tooltip on hover">
            <span class="grip-chip grip-chip-ok">MCP</span>
          </Tooltip>
        </div>
        <FieldRow label="CSS" value="#grip-target" />
        <FieldRow label="XPath" value="//button[@id='grip-target']" />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Icons</h3>
        <div class="lab-icon-grid">
          <HistoryIcon size={16} />
          <McpIcon size={16} />
          <MinusIcon size={16} />
          <MousePointerClickIcon size={16} />
          <PlusIcon size={16} />
          <UndoIcon size={16} />
        </div>
      </section>
    </div>
  );
}

function DevToolsLabContent() {
  const [view, setView] = useState<LabView>("popup");
  const [floatingOpen, setFloatingOpen] = useState(true);
  const [panelShellOpen, setPanelShellOpen] = useState(true);
  const [editorPick, setEditorPick] = useState<StoredPick | null>(null);
  const floatingOpenRef = useRef(floatingOpen);
  const panelShellOpenRef = useRef(panelShellOpen);
  const openPageContextEditor = usePageContextEditor();

  floatingOpenRef.current = floatingOpen;
  panelShellOpenRef.current = panelShellOpen;

  useEffect(() => {
    if (view !== "floating") return;
    return registerTrayHandler("lab-floating-preview", {
      isOpen: () => floatingOpenRef.current,
      setOpen: setFloatingOpen,
    });
  }, [view]);

  useEffect(() => {
    if (view !== "panel") return;
    return registerTrayHandler("lab-panel-preview", {
      isOpen: () => panelShellOpenRef.current,
      setOpen: setPanelShellOpen,
    });
  }, [view]);

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
              <div
                class={`lab-preview lab-preview-panel${panelShellOpen ? "" : " lab-preview-panel-collapsed"}`}
              >
                <GripPanelView onContextEditRequest={openPageContextEditor} />
              </div>
            </LabShellWorkspace>
          )}
          {view === "floating" && (
            <LabShellWorkspace
              editorPick={editorPick}
              onCloseEditor={() => setEditorPick(null)}
              narrow
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
