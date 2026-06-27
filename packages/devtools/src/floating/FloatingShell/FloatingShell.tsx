import type { ComponentChildren } from "preact";
import { GripIcon } from "@/components/GripIcon";

export interface FloatingShellProps {
  open: boolean;
  onToggle: () => void;
  children: ComponentChildren;
}

export function FloatingShell({ open, onToggle, children }: FloatingShellProps) {
  return (
    <div className={`grip-floating-inner${open ? " grip-tray-open" : ""}`}>
      <div className="grip-floating-menu">{children}</div>
      <button
        type="button"
        className="grip-tray-toggle"
        aria-label="Grip picks"
        aria-expanded={open ? "true" : "false"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
      >
        <GripIcon size={24} className="grip-tray-toggle-icon" />
      </button>
    </div>
  );
}
