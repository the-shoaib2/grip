interface SelectDropdownProps {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

export function SelectDropdown({
  label,
  value,
  options,
  onChange,
  className = "",
}: SelectDropdownProps) {
  return (
    <label className={`grip-select-field ${className}`.trim()}>
      {label && <span className="grip-label grip-field-label">{label}</span>}
      <div className="grip-select-wrap">
        <select
          className="grip-select"
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="grip-select-chevron" aria-hidden>
          ▾
        </span>
      </div>
    </label>
  );
}
