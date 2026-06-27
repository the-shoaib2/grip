import type { StoredPick } from "@grip/core";
import type { PageContextEditorMeta } from "@devtools/hooks/usePageContextEditor";
import { GripView } from "@devtools/views/GripView";

export interface GripPopupViewProps {
  onContextEditRequest?: (pick: StoredPick, meta: PageContextEditorMeta) => void;
}

export function GripPopupView({ onContextEditRequest }: GripPopupViewProps) {
  return <GripView variant="popup" onContextEditRequest={onContextEditRequest} />;
}
