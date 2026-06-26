import type { StoredPick } from "@grip/core";
import {
  GripPanelView,
  GripPopupView,
  usePageContextEditor,
} from "@grip/devtools";
import { FloatingShell } from "@grip/devtools-floating";
import { useEffect, useRef, useState } from "preact/hooks";
import { registerTrayHandler } from "../trayBridge";
import { ComponentGallery } from "./ComponentGallery";
import { LabShellWorkspace } from "./LabShellWorkspace";
import type { LabView } from "./types";

export function DevToolsLabContent() {
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
