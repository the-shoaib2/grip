import type { StoredPick } from "@grip/core";
import type { GripShellVariant } from "@devtools/layout";
import type { PageContextEditorMeta } from "@devtools/hooks/usePageContextEditor";
import { GripMainView } from "@devtools/views/GripMainView";

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
