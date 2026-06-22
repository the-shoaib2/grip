import { useState } from "preact/hooks";

interface CopyButtonProps {
  label: string;
  text: string;
  variant?: "secondary" | "ghost";
}

export function CopyButton({ label, text, variant = "secondary" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const cls = variant === "ghost" ? "grip-btn-ghost" : "grip-btn-secondary";

  return (
    <button type="button" className={cls} onClick={copy}>
      {copied ? "Copied" : label}
    </button>
  );
}
