interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CommentField({
  value,
  onChange,
  placeholder = "Context for agent (optional)",
}: CommentFieldProps) {
  return (
    <input
      type="text"
      className="grip-select w-full"
      value={value}
      placeholder={placeholder}
      onInput={(e) => onChange((e.target as HTMLInputElement).value)}
    />
  );
}
