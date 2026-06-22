import { useGripRuntime } from "../../runtime/context";
import type { GripShellVariant } from "../../layout";
import { GripMainView } from "../GripMainView";

export type GripViewVariant = GripShellVariant;

export interface GripViewProps {
  variant: GripViewVariant;
  onMinimize?: () => void;
}

export function GripView({ variant, onMinimize }: GripViewProps) {
  const runtime = useGripRuntime();

  const openPanel =
    variant === "popup"
      ? () => {
          void runtime
            .sendMessage({ type: "TOGGLE_GRIP_TRAY" })
            .catch(() => {
              /* ignore */
            })
            .finally(() => runtime.closeWindow?.());
        }
      : undefined;

  return (
    <GripMainView
      variant={variant}
      closeOnPickSuccess={variant === "popup"}
      syncPanelReady={variant !== "popup"}
      onOpenPanel={openPanel}
      onMinimize={variant === "floating" ? onMinimize : undefined}
    />
  );
}
