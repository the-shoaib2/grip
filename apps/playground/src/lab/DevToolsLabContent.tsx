import type { StoredPick } from "grip-dev";
import {
  GripPanelView,
  GripPopupView,
  usePageContextEditor,
} from "@grip/devtools";
import { FloatingShell } from "@grip/devtools-floating";
import { useEffect, useRef, useState } from "preact/hooks";
import { registerTrayHandler } from "../trayBridge";
import { getColorSchemePreference, applyColorSchemePreference, type ColorSchemePreference } from "../theme";
import { ComponentGallery } from "./ComponentGallery";
import { LabShellWorkspace } from "./LabShellWorkspace";
import type { LabView } from "./types";

export function DevToolsLabContent() {
  const [view, setView] = useState<LabView>("popup");
  const [floatingOpen, setFloatingOpen] = useState(true);
  const [panelShellOpen, setPanelShellOpen] = useState(true);
  const [editorPick, setEditorPick] = useState<StoredPick | null>(null);
  const [themePref, setThemePref] = useState<ColorSchemePreference>(() => getColorSchemePreference());
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

  const handleThemeChange = (pref: ColorSchemePreference) => {
    applyColorSchemePreference(pref);
    setThemePref(pref);
  };

  return (
      <div class="lab-shell">
        <header class="lab-header">
          <div class="lab-header-brand">
            <h1>Grip DevTools UI Lab</h1>
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
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div class="pg-theme" role="group" aria-label="Color scheme" style={{ margin: 0 }}>
              {(["light", "dark", "system"] as const).map((pref) => {
                const icons = {
                  light: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="4"/>
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                    </svg>
                  ),
                  dark: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                    </svg>
                  ),
                  system: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="20" height="14" x="2" y="3" rx="2"/>
                      <line x1="8" x2="16" y1="21" y2="21"/>
                      <line x1="12" x2="12" y1="17" y2="21"/>
                    </svg>
                  ),
                };

                return (
                  <button
                    key={pref}
                    type="button"
                    data-pg-theme={pref}
                    class={`pg-theme-btn${themePref === pref ? " pg-theme-btn-active" : ""}`}
                    onClick={() => handleThemeChange(pref)}
                    aria-label={`${pref.charAt(0).toUpperCase() + pref.slice(1)} Mode`}
                    title={`${pref.charAt(0).toUpperCase() + pref.slice(1)} Mode`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.4rem" }}
                  >
                    {icons[pref]}
                  </button>
                );
              })}
            </div>
            <a class="lab-back" href="/">
              ← Back to Page
            </a>
          </div>
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
