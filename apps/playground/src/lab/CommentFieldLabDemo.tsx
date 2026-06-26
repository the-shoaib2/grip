import { composerStateForStoredPick } from "@grip/core";
import { CommentField, usePickHistory } from "@grip/devtools";
import { useEffect, useState } from "preact/hooks";

export function CommentFieldLabDemo() {
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
    return <p class="grip-empty-state">Select a pick in history to preview CommentField.</p>;
  }

  const { chips } = composerStateForStoredPick(activePick);

  return (
    <CommentField
      chips={chips}
      value={value}
      onChange={setValue}
      placeholder="Describe what you need…"
    />
  );
}
