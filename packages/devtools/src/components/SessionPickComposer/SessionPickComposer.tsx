import { useEffect, useMemo, useState } from "preact/hooks";
import type { StoredPick } from "@grip/core";
import {
  composerStateForStoredPick,
  formatPickIndexLabel,
} from "../../lib/storedPickComposer";
import { CommentField } from "../CommentField";
import { ElementTagBadge } from "../ElementTagBadge";

export interface SessionPickComposerProps {
  pick: StoredPick;
  pickIndex: number;
  pickCount: number;
  onSave: (comment: string) => void | Promise<void>;
  onNavigate?: (pick: StoredPick) => void;
}

export function SessionPickComposer({
  pick,
  pickIndex,
  pickCount,
  onSave,
  onNavigate,
}: SessionPickComposerProps) {
  const { chips: initialChips, comment: initialComment } = useMemo(
    () => composerStateForStoredPick(pick),
    [pick],
  );
  const [comment, setComment] = useState(initialComment);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setComment(initialComment);
  }, [pick.id, initialComment]);

  const dirty = comment !== initialComment;
  const indexLabel = formatPickIndexLabel(pickIndex, pickCount);

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave(comment);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grip-session-main" aria-label="Current pick">
      <div className="grip-session-main-header">
        <span className="grip-session-pick-index">{indexLabel}</span>
        <ElementTagBadge tagName={pick.tagName} role={pick.role} />
      </div>

      <CommentField
        chips={initialChips}
        value={comment}
        onChange={setComment}
        placeholder="Select elements on the page, then describe what you need…"
        onChipActivate={() => {
          onNavigate?.(pick);
        }}
      />

      <div className="grip-session-main-actions">
        <button
          type="button"
          className="grip-btn-secondary grip-btn-save"
          disabled={!dirty || saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}
