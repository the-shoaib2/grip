import { GripSessionToolbar } from "@grip/devtools";
import { useState } from "preact/hooks";

export function ToolbarLabDemo() {
  const [pickActive, setPickActive] = useState(false);
  const [historyView, setHistoryView] = useState(false);

  return (
    <GripSessionToolbar
      variant="popup"
      pickActive={pickActive}
      historyView={historyView}
      onPick={() => setPickActive((active) => !active)}
      onToggleHistoryView={() => setHistoryView((open) => !open)}
      onNewSession={() => {
        setHistoryView(false);
        setPickActive(false);
      }}
    />
  );
}
