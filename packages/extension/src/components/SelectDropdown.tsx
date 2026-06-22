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
    <label className={`block ${className}`}>
      {label && <span className="grip-label mb-1.5 block">{label}</span>}
      <div className="grip-select-wrap">
        <select
          className="grip-select w-full"
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
