import { composerStateForStoredPick } from "@grip/core";
import { ContextField, usePickHistory } from "@grip/devtools";
import { useEffect, useState } from "preact/hooks";

export function ContextFieldLabDemo() {
  const { activePick } = usePickHistory();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!activePick) {
      setValue("");
      return;
    }
    setValue(composerStateForStoredPick(activePick).comment);
  }, [activePick?.id, activePick?.comment]);

  if (!activePick) {
    return <p class="grip-empty-state">Select a pick in history to preview ContextField.</p>;
  }

  const { chips } = composerStateForStoredPick(activePick);

  return (
    <ContextField
      chips={chips}
      value={value}
      onChange={setValue}
      placeholder="Describe what you need…"
    />
  );
}
