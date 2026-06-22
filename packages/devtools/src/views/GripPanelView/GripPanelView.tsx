import { GripView } from "../GripView";

export interface GripPanelViewProps {
  layout?: "panel" | "floating";
  onMinimize?: () => void;
}

export function GripPanelView({ layout = "panel", onMinimize }: GripPanelViewProps) {
  return <GripView variant={layout} onMinimize={onMinimize} />;
}
