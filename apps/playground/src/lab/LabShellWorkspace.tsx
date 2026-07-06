import type { ComponentChildren } from "preact";
import type { StoredPick } from "grip-dev";
import { ContextFieldSection } from "./ContextFieldSection";

export function LabShellWorkspace({
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
        class={`lab-block lab-context-editor-block${editorPick ? " lab-context-editor-open" : ""}`}
      >
        <h3 class="lab-block-title">Context field</h3>
        <ContextFieldSection pick={editorPick} onClose={onCloseEditor} />
      </section>
    </div>
  );
}
