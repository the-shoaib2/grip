import { useEffect, useRef, useState } from "preact/hooks";
import {
  composerStateForStoredPick,
  formatMcpPrompt,
  type StoredPick,
} from "@grip/core";
import { ContextField } from "../ContextField";
import { CopyButton } from "../CopyButton";
import { GripShellDialog } from "../GripShellDialog";
import { Tooltip } from "../Tooltip";
import { UndoIcon } from "../icons";

export interface SessionPickComposerProps {
  pick: StoredPick;
  pickIndex: number;
  pickCount: number;
  sessionPicks?: StoredPick[];
  onCommentChange?: (comment: string) => void | Promise<void>;
  onNavigate?: (pick: StoredPick) => void;
  /** After confirm dialog — open the page-level picker comment panel. */
  onEditRequest?: (
    pick: StoredPick,
    meta: { pickIndex: number; pickCount: number },
  ) => void;
}

export function SessionPickComposer({
  pick,
  pickIndex,
  pickCount,
  sessionPicks = [],
  onCommentChange,
  onNavigate,
  onEditRequest,
}: SessionPickComposerProps) {
  const baseline = useRef("");
  const chipsRef = useRef(composerStateForStoredPick(pick, sessionPicks).chips);
  const [displayComment, setDisplayComment] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canUndo = displayComment !== baseline.current;
  const copyText = formatMcpPrompt({ ...pick, comment: displayComment });

  useEffect(() => {
    const state = composerStateForStoredPick(pick, sessionPicks);
    baseline.current = state.comment;
    chipsRef.current = state.chips;
    setDisplayComment(state.comment);
  }, [pick.id, sessionPicks]);

  useEffect(() => {
    const state = composerStateForStoredPick(pick, sessionPicks);
    chipsRef.current = state.chips;
    setDisplayComment(state.comment);
  }, [pick.comment, pick.id, sessionPicks]);

  const requestEdit = () => {
    if (onEditRequest) setConfirmOpen(true);
  };

  const confirmEdit = () => {
    setConfirmOpen(false);
    onEditRequest?.(pick, { pickIndex, pickCount });
  };

  const undoToBaseline = (e: Event) => {
    e.stopPropagation();
    const previous = baseline.current;
    setDisplayComment(previous);
    void onCommentChange?.(previous);
  };

  return (
    <>
      <div className="grip-picker-panel grip-session-panel" aria-label="Current pick">
        <div className="grip-session-context-wrap">
          <div
            className="grip-session-context-preview"
            role="button"
            tabIndex={0}
            aria-label="Edit context prompt"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest(".grip-inline-chip, .grip-context-composer-actions")) {
                return;
              }
              requestEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                requestEdit();
              }
            }}
          >
            <ContextField
              chips={chipsRef.current}
              value={displayComment}
              onChange={() => {}}
              readOnly
              tagName={pick.tagName}
              role={pick.role}
              onChipActivate={() => {
                onNavigate?.(pick);
              }}
              composerActions={
                <>
                  {canUndo ? (
                    <Tooltip text="Undo changes">
                      <button
                        type="button"
                        className="grip-btn-icon"
                        aria-label="Undo changes"
                        onClick={undoToBaseline}
                      >
                        <UndoIcon size={12} />
                      </button>
                    </Tooltip>
                  ) : null}
                  <CopyButton
                    label="Copy"
                    text={copyText}
                    tooltip="Copy prompt"
                    variant="ghost"
                    size="icon"
                  />
                </>
              }
            />
          </div>
        </div>
      </div>

      <GripShellDialog
        open={confirmOpen}
        title="Edit context?"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmEdit}
      >
        <p className="grip-shell-dialog-lead">
          Open the comment panel on the page to edit this pick&apos;s context.
        </p>
      </GripShellDialog>
    </>
  );
}
