import { Icon, type IconProps } from "./Icon";

/** Lucide Undo2 */
export function UndoIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </Icon>
  );
}
