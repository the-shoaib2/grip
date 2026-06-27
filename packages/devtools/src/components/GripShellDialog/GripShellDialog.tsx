import type { ComponentChildren } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useRef } from "preact/hooks";
import { useGripShellRef } from "@/layout/GripShellContext";

export interface GripShellDialogProps {
  open: boolean;
  title?: string;
  children?: ComponentChildren;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function GripShellDialog({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: GripShellDialogProps) {
  const shellRef = useGripShellRef();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    confirmRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !shellRef?.current) return null;

  return createPortal(
    <div className="grip-shell-dialog-overlay" onMouseDown={onCancel}>
      <div
        className="grip-shell-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "grip-shell-dialog-title" : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title ? (
          <h2 id="grip-shell-dialog-title" className="grip-shell-dialog-title">
            {title}
          </h2>
        ) : null}
        {children ? <div className="grip-shell-dialog-body">{children}</div> : null}
        <div className="grip-shell-dialog-actions">
          <button type="button" className="grip-picker-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="grip-picker-save"
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    shellRef.current,
  );
}
