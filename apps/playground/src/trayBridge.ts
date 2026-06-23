type TrayHandler = {
  id: string;
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
};

const handlers = new Map<string, TrayHandler>();
let trayWasOpenBeforeHandoff = false;

export function registerTrayHandler(
  id: string,
  handler: { isOpen: () => boolean; setOpen: (open: boolean) => void },
): () => void {
  handlers.set(id, { id, ...handler });
  return () => {
    handlers.delete(id);
  };
}

export function hideTrayForHandoff(): void {
  trayWasOpenBeforeHandoff = [...handlers.values()].some((handler) => handler.isOpen());
  for (const handler of handlers.values()) {
    handler.setOpen(false);
  }
}

export function showTrayAfterHandoff(restore: boolean): void {
  const nextOpen = restore ? trayWasOpenBeforeHandoff : true;
  for (const handler of handlers.values()) {
    handler.setOpen(nextOpen);
  }
  trayWasOpenBeforeHandoff = false;
}
