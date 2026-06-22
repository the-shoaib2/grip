export function formatSessionLabel(pickCount: number): string {
  return pickCount > 0 ? `Session · ${pickCount}` : "Session";
}
