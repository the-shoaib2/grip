import { formatPickIndexLabel } from "@grip/core";

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

export function formatCurrentSessionPickLabel(index: number, total: number): string {
  return `Current session · ${formatPickIndexLabel(index, total)}`;
}
