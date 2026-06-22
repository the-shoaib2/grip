import type { GripShellVariant } from "../../layout";
import { GripMainView } from "../GripMainView";

export type GripViewVariant = GripShellVariant;

export interface GripViewProps {
  variant: GripViewVariant;
  onMinimize?: () => void;
}

export function GripView({ variant, onMinimize }: GripViewProps) {
  return (
    <GripMainView
      variant={variant}
      closeOnPickSuccess={variant === "popup"}
      syncPanelReady={variant !== "popup"}
      onMinimize={variant === "floating" ? onMinimize : undefined}
    />
  );
}
