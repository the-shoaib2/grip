import { useState } from "preact/hooks";
import { Tooltip } from "./Tooltip";

interface CopyButtonProps {
  label: string;
  text: string;
  tooltip?: string;
  variant?: "secondary" | "ghost";
  size?: "default" | "icon";
  disabled?: boolean;
}

export function CopyButton({
  label,
  text,
  tooltip,
  variant = "secondary",
  size = "default",
  disabled = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: Event) => {
    e.stopPropagation();
    if (!text || disabled) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const cls =
    size === "icon"
      ? "grip-btn-icon"
      : variant === "ghost"
        ? "grip-btn-ghost"
        : "grip-btn-secondary";

  const tip = copied
    ? "Copied!"
    : !text
      ? "Nothing to copy"
      : (tooltip ?? label);

  return (
    <Tooltip text={tip} position="top">
      <button
        type="button"
        className={cls}
        aria-label={tooltip ?? label}
        disabled={disabled || !text}
        onClick={copy}
      >
        {size === "icon" ? (
          copied ? (
            <span className="text-[10px]">✓</span>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden>
              <rect x="9" y="9" width="13" height="13" rx="1" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )
        ) : copied ? (
          "Copied"
        ) : (
          label
        )}
      </button>
    </Tooltip>
  );
}
