import { useState } from "preact/hooks";
import type { StoredPick } from "grip-dev";
import { CheckIcon, CopyIcon } from "@devtools/components/icons";

interface SyncButtonProps {
  picks: StoredPick[];
  label?: string;
  tooltip?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "icon" | "sm";
}

export function SyncButton({
  picks,
  label = "Sync to IDE",
  tooltip = "Send data to IDE Agent",
  variant = "default",
  size = "default",
}: SyncButtonProps) {
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    try {
      const sessionId = picks[0]?.sessionId || `sess_${Date.now()}`;
      const payload = {
        sessionId,
        picks,
      };
      
      const res = await fetch("http://127.0.0.1:9223/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to sync");
      }
      
      const data = await res.json();
      
      const prompt = `I have prepared a new Grip session. Please read it using get_session_context for session ID: ${data.sessionId}`;
      await navigator.clipboard.writeText(prompt);
      
      setSynced(true);
      setError(null);
      setTimeout(() => setSynced(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
      setTimeout(() => setError(null), 3000);
    }
  };

  const className = `grip-btn grip-btn-${variant} grip-btn-${size}`;

  return (
    <button
      type="button"
      className={className}
      onClick={handleSync}
      title={error || tooltip}
      aria-label={label}
    >
      {synced ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      {size !== "icon" && <span className="grip-btn-label">{synced ? "Synced!" : label}</span>}
    </button>
  );
}
