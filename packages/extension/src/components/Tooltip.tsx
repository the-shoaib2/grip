import type { ComponentChildren } from "preact";

interface TooltipProps {
  text: string;
  children: ComponentChildren;
  position?: "top" | "bottom";
  wide?: boolean;
  className?: string;
}

export function Tooltip({
  text,
  children,
  position = "top",
  wide = false,
  className = "",
}: TooltipProps) {
  if (!text) return <>{children}</>;

  const posCls = position === "top" ? "grip-tooltip-top" : "grip-tooltip-bottom";

  return (
    <span className={`grip-tooltip-wrap ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`grip-tooltip ${posCls} ${wide ? "grip-tooltip-wide" : ""}`}
      >
        {text}
      </span>
    </span>
  );
}
