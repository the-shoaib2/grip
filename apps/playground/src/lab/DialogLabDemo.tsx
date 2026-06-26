import { GripRootLayout, GripShellDialog } from "@grip/devtools";
import { useState } from "preact/hooks";

export function DialogLabDemo() {
  const [open, setOpen] = useState(false);

  return (
    <GripRootLayout variant="popup" className="lab-dialog-preview">
      <button type="button" class="grip-btn-secondary" onClick={() => setOpen(true)}>
        Open confirm dialog
      </button>
      <GripShellDialog
        open={open}
        title="Edit context?"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      >
        <p class="grip-shell-dialog-lead">
          Open the comment panel on the page to edit this pick&apos;s context.
        </p>
      </GripShellDialog>
    </GripRootLayout>
  );
}
