import type { StoredPick } from "@grip/core";
import type { GripShellVariant } from "@/layout";
import type { PageContextEditorMeta } from "@/hooks/usePageContextEditor";
import { GripMainView } from "@/views/GripMainView";

export type GripViewVariant = GripShellVariant;

export interface GripViewProps {
  variant: GripViewVariant;
  onMinimize?: () => void;
  onContextEditRequest?: (pick: StoredPick, meta: PageContextEditorMeta) => void;
}

export function GripView({ variant, onMinimize, onContextEditRequest }: GripViewProps) {
  return (
    <GripMainView
      variant={variant}
      closeOnPickSuccess={variant === "popup"}
      syncPanelReady={variant !== "popup"}
      onMinimize={variant === "floating" ? onMinimize : undefined}
      onContextEditRequest={onContextEditRequest}
    />
  );
}
