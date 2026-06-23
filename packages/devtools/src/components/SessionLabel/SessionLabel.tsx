import { formatSessionLabel } from "../../lib/sessionLabel";

export interface SessionLabelProps {
  pickCount: number;
  current?: boolean;
  className?: string;
}

export function SessionLabel({ pickCount, current = false, className }: SessionLabelProps) {
  const label = formatSessionLabel(pickCount, { current });
  if (!label) return null;

  const rootClass = className
    ? `grip-label grip-label-plain ${className}`
    : "grip-label grip-label-plain";

  return <span className={rootClass}>{label}</span>;
}
