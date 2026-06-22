import { useEffect, useRef } from "preact/hooks";

interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tagName?: string;
  role?: string;
  tags?: string[];
  maxHeight?: number;
}

function syncGrow(input: HTMLTextAreaElement, grow: HTMLElement): void {
  const mirror = input.value.length > 0 ? input.value : input.placeholder;
  grow.setAttribute("data-value", mirror);
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const growRef = useRef<HTMLSpanElement>(null);

  const chipTags = tags?.length
    ? tags
    : tagName
      ? [tagName.toLowerCase(), ...(role && role !== tagName.toLowerCase() ? [role] : [])]
      : [];

  useEffect(() => {
    if (inputRef.current && growRef.current) {
      syncGrow(inputRef.current, growRef.current);
    }
  }, [value, placeholder, chipTags.length]);

  return (
    <div className="grip-context-field">
      <div
        className="grip-context-composer"
        style={{ maxHeight: `${maxHeight}px` }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".grip-pending-chip, .grip-el-badge")) return;
          inputRef.current?.focus();
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
          <span
            ref={growRef}
            className="grip-input-grow"
            data-value={value || (chipTags.length ? "" : placeholder)}
          >
            <textarea
              ref={inputRef}
              className="grip-textarea grip-context-input"
              value={value}
              placeholder={chipTags.length ? "" : placeholder}
              rows={1}
              onInput={(e) => {
                const input = e.target as HTMLTextAreaElement;
                if (growRef.current) syncGrow(input, growRef.current);
                onChange(input.value);
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
