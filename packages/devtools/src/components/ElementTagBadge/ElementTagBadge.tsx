interface ElementTagBadgeProps {
  tagName: string;
  role?: string;
  className?: string;
}

export function ElementTagBadge({ tagName, className = "" }: ElementTagBadgeProps) {
  const tag = tagName.toLowerCase();

  return (
    <span className={`grip-el-badges ${className}`.trim()}>
      <span className="grip-el-badge">{tag}</span>
    </span>
  );
}
