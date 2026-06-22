import { formatSessionLabel } from "../../lib/sessionLabel";

export interface SessionLabelProps {
  pickCount: number;
  className?: string;
}

export function SessionLabel({ pickCount, className }: SessionLabelProps) {
  const rootClass = className
    ? `grip-label grip-label-plain ${className}`
    : "grip-label grip-label-plain";

  return <span className={rootClass}>{formatSessionLabel(pickCount)}</span>;
}
