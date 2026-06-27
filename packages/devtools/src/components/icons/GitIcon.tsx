import { Icon, type IconProps } from "@devtools/components/icons/Icon";

/** Lucide GitBranch */
export function GitIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 15V9a4 4 0 0 0-4-4H9" />
      <line x1="6" x2="6" y1="9" y2="15" />
    </Icon>
  );
}
