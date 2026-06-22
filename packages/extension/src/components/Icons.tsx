import type { ComponentChildren } from "preact";

interface IconProps {
  size?: number;
  className?: string;
}

function Icon({
  size = 18,
  className = "",
  children,
}: IconProps & { children: ComponentChildren }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Cursor pointer — Lucide MousePointer2 */
export function MousePointerClickIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.124a.5.5 0 0 1-.947.063z" />
    </Icon>
  );
}

/** Lucide History */
export function HistoryIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </Icon>
  );
}

/** Lucide Plus */
export function PlusIcon({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Icon>
  );
}
