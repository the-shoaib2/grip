import type { FloatingGripController } from "@grip/devtools-floating";

let controller: FloatingGripController | null = null;
let wasOpenBeforeHandoff = false;

export function registerFloatingController(next: FloatingGripController): void {
  controller = next;
}

export function hideFloatingTray(): void {
  if (!controller) return;
  wasOpenBeforeHandoff = controller.isOpen();
  controller.setOpen(false);
}

/** Show the floating tray. Default: always open (after save). Use restore to reopen only if it was open before handoff. */
export function showFloatingTray(options?: { restore?: boolean }): void {
  if (!controller) return;
  const nextOpen = options?.restore ? wasOpenBeforeHandoff : true;
  controller.setOpen(nextOpen);
  wasOpenBeforeHandoff = false;
}
