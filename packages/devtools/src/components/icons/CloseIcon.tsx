import { Icon, type IconProps } from "@devtools/components/icons/Icon";

/** Lucide X */
export function CloseIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}
