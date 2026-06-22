interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tagName?: string;
  role?: string;
  tags?: string[];
  maxHeight?: number;
}

export function CommentField({
  value,
  onChange,
  placeholder = "Describe what you need…",
  tagName,
  role,
  tags,
  maxHeight = 160,
}: CommentFieldProps) {
  const chipTags = tags?.length
    ? tags
    : tagName
      ? [tagName.toLowerCase(), ...(role && role !== tagName.toLowerCase() ? [role] : [])]
      : [];

  return (
    <div className="grip-context-field">
      <div
        className="grip-context-composer"
        style={{ maxHeight: `${maxHeight}px` }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".grip-pending-chip, .grip-el-badge")) return;
          const input = (e.currentTarget as HTMLElement).querySelector("textarea");
          input?.focus();
        }}
      >
        <div className="grip-context-inline">
          {chipTags.length > 0 ? (
            <div className="grip-context-badges">
              {chipTags.map((tag) => (
                <span key={tag} className="grip-el-badge">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <textarea
            className="grip-textarea grip-context-input"
            value={value}
            placeholder={chipTags.length ? "" : placeholder}
            rows={1}
            onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
          />
        </div>
      </div>
    </div>
  );
}
