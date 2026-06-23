import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { composerStateForStoredPick, type StoredPick } from "@grip/core";
import { CommentField } from "../CommentField";

export interface ContextEditorPanelProps {
  pick: StoredPick;
  onSave: (comment: string) => void | Promise<void>;
  onClose: () => void;
  onNavigate?: (pick: StoredPick) => void;
}

/** Shared comment field for creating and editing pick context (outside the popup shell). */
export function ContextEditorPanel({
  pick,
  onSave,
  onClose,
  onNavigate,
}: ContextEditorPanelProps) {
  const { chips, comment: initialComment } = useMemo(
    () => composerStateForStoredPick(pick),
    [pick.id, pick.comment],
  );
  const [draft, setDraft] = useState(initialComment);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(initialComment);
  }, [pick.id, initialComment]);

  useEffect(() => {
    hostRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pick.id]);

  return (
    <div ref={hostRef} className="grip-context-editor-host">
      <CommentField
        chips={chips}
        value={draft}
        onChange={setDraft}
        placeholder="Select elements on the page, then describe what you need…"
        onChipActivate={() => {
          onNavigate?.(pick);
        }}
      />
      <div className="grip-picker-actions">
        <button type="button" className="grip-picker-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="grip-picker-save"
          disabled={draft === initialComment}
          onClick={() => {
            void onSave(draft);
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
