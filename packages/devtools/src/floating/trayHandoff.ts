let trayWasOpenBeforeHandoff = false;

export function recordTrayHandoff(wasOpen: boolean): void {
  trayWasOpenBeforeHandoff = wasOpen;
}

export function shouldRestoreTray(): boolean {
  return trayWasOpenBeforeHandoff;
}

export function clearTrayHandoff(): void {
  trayWasOpenBeforeHandoff = false;
}
