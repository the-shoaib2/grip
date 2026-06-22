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
      {label && <span className="grip-label mb-1 block">{label}</span>}
      <div className="relative">
        <select
          className="grip-select w-full appearance-none pr-8"
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
          ▾
        </span>
      </div>
    </label>
  );
}
