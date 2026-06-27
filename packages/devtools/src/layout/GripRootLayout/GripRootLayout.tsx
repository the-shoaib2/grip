import type { ComponentChildren } from "preact";
import { useRef } from "preact/hooks";
import { GripShellRefContext } from "@/layout/GripShellContext";

export type GripShellVariant = "popup" | "panel" | "floating";

const SHELL_CLASS: Record<GripShellVariant, string> = {
  popup: "grip-popup",
  panel: "grip-popup grip-shell-devtools",
  floating: "grip-popup grip-shell-floating",
};

export function gripShellClassName(variant: GripShellVariant): string {
  return SHELL_CLASS[variant];
}

export interface GripRootLayoutProps {
  variant: GripShellVariant;
  className?: string;
  children: ComponentChildren;
}

export function GripRootLayout({ variant, className, children }: GripRootLayoutProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const shellClass = gripShellClassName(variant);
  const rootClass = className ? `${shellClass} ${className}` : shellClass;

  return (
    <GripShellRefContext.Provider value={shellRef}>
      <div ref={shellRef} className={rootClass} data-grip-shell={variant}>
        {children}
      </div>
    </GripShellRefContext.Provider>
  );
}
