import { formatSessionLabel } from "../../lib/sessionLabel";

export interface SessionLabelProps {
  pickCount: number;
  className?: string;
}

export function SessionLabel({ pickCount, className }: SessionLabelProps) {
  const label = formatSessionLabel(pickCount);
  if (!label) return null;

  const rootClass = className
    ? `grip-label grip-label-plain ${className}`
    : "grip-label grip-label-plain";

  return <span className={rootClass}>{label}</span>;
}
