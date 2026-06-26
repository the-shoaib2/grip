import type { ComponentChildren } from "preact";
import type { StoredPick } from "@grip/core";
import { CommentFieldSection } from "./CommentFieldSection";

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
        class="lab-block lab-context-editor-block"
      >
        <h3 class="lab-block-title">Comment field</h3>
        <CommentFieldSection pick={editorPick} onClose={onCloseEditor} />
      </section>
    </div>
  );
}
