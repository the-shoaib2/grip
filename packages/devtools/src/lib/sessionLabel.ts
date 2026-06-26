export const DEFAULT_SESSION_TAB_TITLE = "New Element";

export function formatSessionTabTitle(picks: { label: string }[]): string {
  if (!picks.length) return DEFAULT_SESSION_TAB_TITLE;
  const label = picks[picks.length - 1].label.trim() || DEFAULT_SESSION_TAB_TITLE;
  return label.length > 14 ? `${label.slice(0, 11)}…` : label;
}

export function formatSessionLabel(
  pickCount: number,
  options?: { current?: boolean },
): string | null {
  if (pickCount <= 0) return null;
  return options?.current
    ? `Current session · ${pickCount}`
    : `Session · ${pickCount}`;
}

export function formatSessionGroupTitle(
  picks: { timestamp: number }[],
  isActive: boolean,
): string {
  const count = picks.length;
  if (isActive) return `Current session · ${count}`;
  const last = picks[picks.length - 1];
  if (!last) return `Session · ${count}`;
  const time = new Date(last.timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Session ${time} · ${count}`;
}
