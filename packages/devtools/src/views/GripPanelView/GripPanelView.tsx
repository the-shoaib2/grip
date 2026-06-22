import { GripMainView } from "../GripMainView";

export interface GripPanelViewProps {
  layout?: "panel" | "floating";
  onMinimize?: () => void;
}

export function GripPanelView({ layout = "panel", onMinimize }: GripPanelViewProps) {
  const shellClass =
    layout === "floating" ? "grip-popup grip-shell-floating" : "grip-popup grip-shell-devtools";

  return (
    <GripMainView
      className={shellClass}
      syncPanelReady
      onMinimize={layout === "floating" ? onMinimize : undefined}
    />
  );
}
