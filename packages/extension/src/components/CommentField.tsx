interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tagName?: string;
  role?: string;
  maxHeight?: number;
}

export function CommentField({
  value,
  onChange,
  placeholder = "Add context for this element…",
  tagName,
  role,
  maxHeight = 120,
}: CommentFieldProps) {
  return (
    <div className="grip-context-field">
      {tagName ? (
        <div className="grip-context-badges">
          <span className="grip-el-badge">{tagName.toLowerCase()}</span>
          {role && role !== tagName.toLowerCase() ? (
            <span className="grip-el-badge">{role}</span>
          ) : null}
        </div>
      ) : null}
      <textarea
        className="grip-textarea grip-context-input"
        value={value}
        placeholder={placeholder}
        rows={2}
        style={{ maxHeight: `${maxHeight}px` }}
        onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
      />
    </div>
  );
}
