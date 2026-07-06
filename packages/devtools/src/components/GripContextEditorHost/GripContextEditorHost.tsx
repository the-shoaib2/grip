import { useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import type { StoredPick } from "grip-dev";
import { usePickHistory } from "@devtools/hooks/usePickHistory";
import type { PageContextEditorMeta } from "@devtools/hooks/usePageContextEditor";
import { ContextEditorPanel } from "@devtools/components/ContextEditorPanel";

export interface GripContextEditorHostProps {
  children: (onContextEditRequest: (pick: StoredPick, meta: PageContextEditorMeta) => void) => ComponentChildren;
  /** When false, hide the placeholder until a pick is opened for edit. */
  showPlaceholder?: boolean;
}

/** Hosts the external comment field used after confirming edit in the shell. */
export function GripContextEditorHost({
  children,
  showPlaceholder = true,
}: GripContextEditorHostProps) {
  const [editorPick, setEditorPick] = useState<StoredPick | null>(null);
  const { savePickComment, selectPick } = usePickHistory();

  return (
    <>
      {children(setEditorPick)}
      {editorPick ? (
        <ContextEditorPanel
          pick={editorPick}
          onClose={() => setEditorPick(null)}
          onSave={(comment) => savePickComment(editorPick.id, comment)}
          onNavigate={selectPick}
        />
      ) : showPlaceholder ? (
        <p className="grip-empty-state">
          Pick an element or click context in the shell, then confirm to create or edit here.
        </p>
      ) : null}
    </>
  );
}
