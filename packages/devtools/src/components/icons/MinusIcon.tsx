import { Icon, type IconProps } from "./Icon";

/** Lucide Minus */
export function MinusIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M5 12h14" />
    </Icon>
  );
}
