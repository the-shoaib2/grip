import { useEffect, useMemo, useState } from "preact/hooks";
import { composerStateForStoredPick, type StoredPick } from "@grip/core";
import { ContextField } from "../ContextField";

export interface ContextEditorPanelProps {
  pick: StoredPick;
  sessionPicks?: StoredPick[];
  onSave: (comment: string) => void | Promise<void>;
  onClose: () => void;
  onNavigate?: (pick: StoredPick) => void;
}

/** Shared context field for creating and editing pick context (outside the popup shell). */
export function ContextEditorPanel({
  pick,
  sessionPicks = [],
  onSave,
  onClose,
  onNavigate,
}: ContextEditorPanelProps) {
  const { chips, comment: initialComment } = useMemo(
    () => composerStateForStoredPick(pick, sessionPicks),
    [pick.id, pick.comment, sessionPicks],
  );
  const [draft, setDraft] = useState(initialComment);

  useEffect(() => {
    setDraft(initialComment);
  }, [pick.id, initialComment]);

  return (
    <div className="grip-context-editor-host">
      <ContextField
        chips={chips}
        value={draft}
        onChange={setDraft}
        autoFocusKey={pick.id}
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
