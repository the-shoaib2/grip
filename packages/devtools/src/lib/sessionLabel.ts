export function formatSessionLabel(pickCount: number): string | null {
  return pickCount > 0 ? `Session · ${pickCount}` : null;
}
