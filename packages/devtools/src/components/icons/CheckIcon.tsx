import { Icon, type IconProps } from "@devtools/components/icons/Icon";

/** Lucide Check */
export function CheckIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}
