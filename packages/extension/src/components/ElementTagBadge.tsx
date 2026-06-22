interface ElementTagBadgeProps {
  tagName: string;
  role?: string;
  className?: string;
}

export function ElementTagBadge({ tagName, role, className = "" }: ElementTagBadgeProps) {
  const tag = tagName.toLowerCase();
  const showRole = Boolean(role && role !== tag);

  return (
    <span className={`grip-el-badges ${className}`.trim()}>
      <span className="grip-el-badge">{tag}</span>
      {showRole && <span className="grip-el-badge">{role}</span>}
    </span>
  );
}
