import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  composerStateForStoredPick,
  formatPickIndexLabel,
  type StoredPick,
} from "@grip/core";
import { CommentField } from "../CommentField";

export interface SessionPickComposerProps {
  pick: StoredPick;
  pickIndex: number;
  pickCount: number;
  /** Persist prompt edits — debounced; no Save button in the panel. */
  onCommentChange?: (comment: string) => void | Promise<void>;
  onNavigate?: (pick: StoredPick) => void;
}

const SAVE_DEBOUNCE_MS = 400;

export function SessionPickComposer({
  pick,
  pickIndex,
  pickCount,
  onCommentChange,
  onNavigate,
}: SessionPickComposerProps) {
  const { chips: initialChips, comment: initialComment } = useMemo(
    () => composerStateForStoredPick(pick),
    [pick],
  );
  const [comment, setComment] = useState(initialComment);
  const saveTimer = useRef<number | undefined>(undefined);
  const latestComment = useRef(initialComment);

  useEffect(() => {
    setComment(initialComment);
    latestComment.current = initialComment;
  }, [pick.id, initialComment]);

  useEffect(
    () => () => {
      if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  const indexLabel = formatPickIndexLabel(pickIndex, pickCount);

  const scheduleSave = (next: string) => {
    latestComment.current = next;
    if (!onCommentChange || next === initialComment) return;
    if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = undefined;
      if (latestComment.current !== initialComment) {
        void onCommentChange(latestComment.current);
      }
    }, SAVE_DEBOUNCE_MS);
  };

  return (
    <div className="grip-picker-panel grip-session-panel" aria-label="Current pick">
      <div className="grip-picker-header">
        <span className="grip-picker-session">{indexLabel}</span>
        <span className="grip-picker-hint">click chip to locate</span>
      </div>

      <CommentField
        chips={initialChips}
        value={comment}
        onChange={(next) => {
          setComment(next);
          scheduleSave(next);
        }}
        placeholder="Select elements on the page, then describe what you need…"
        onChipActivate={() => {
          onNavigate?.(pick);
        }}
      />
    </div>
  );
}
