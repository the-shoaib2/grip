import type { ComponentChildren } from "preact";

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
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </button>
    </div>
  );
}
