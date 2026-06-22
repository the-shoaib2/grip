interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CommentField({
  value,
  onChange,
  placeholder = "What should the agent do with this element?",
}: CommentFieldProps) {
  return (
    <label className="block space-y-1">
      <span className="grip-label">Context comment</span>
      <p className="text-[10px] text-zinc-600">Included in the MCP prompt for the agent.</p>
      <textarea
        className="grip-textarea"
        rows={3}
        value={value}
        placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
      />
    </label>
  );
}
