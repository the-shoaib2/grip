import { CopyButton } from "./CopyButton";

interface FieldRowProps {
  label: string;
  value: string;
  copyLabel?: string;
}

export function FieldRow({ label, value, copyLabel = "Copy" }: FieldRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="grip-label">{label}</span>
        <CopyButton
          label={copyLabel}
          text={value}
          tooltip={`Copy ${label.toLowerCase()}`}
          variant="ghost"
        />
      </div>
      <div className="grip-value">{value}</div>
    </div>
  );
}
