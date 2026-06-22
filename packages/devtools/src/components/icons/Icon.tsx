import type { ComponentChildren } from "preact";

export interface IconProps {
  size?: number;
  className?: string;
}

export function Icon({
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
