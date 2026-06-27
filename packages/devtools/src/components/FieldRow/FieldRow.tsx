import { CopyButton } from "@/components/CopyButton";

interface FieldRowProps {
  label: string;
  value: string;
  copyLabel?: string;
}

export function FieldRow({ label, value, copyLabel = "Copy" }: FieldRowProps) {
  return (
    <div className="grip-field-row">
      <div className="grip-field-row-header">
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
