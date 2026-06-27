import type { StoredPick } from "@grip/core";
import type { PageContextEditorMeta } from "@devtools/hooks/usePageContextEditor";
import { GripView } from "@devtools/views/GripView";

export interface GripPanelViewProps {
  layout?: "panel" | "floating";
  onMinimize?: () => void;
  onContextEditRequest?: (pick: StoredPick, meta: PageContextEditorMeta) => void;
}

export function GripPanelView({
  layout = "panel",
  onMinimize,
  onContextEditRequest,
}: GripPanelViewProps) {
  return (
    <GripView
      variant={layout}
      onMinimize={onMinimize}
      onContextEditRequest={onContextEditRequest}
    />
  );
}
