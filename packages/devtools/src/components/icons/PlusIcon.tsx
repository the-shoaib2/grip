import { Icon, type IconProps } from "@/components/icons/Icon";

/** Lucide Plus */
export function PlusIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Icon>
  );
}
