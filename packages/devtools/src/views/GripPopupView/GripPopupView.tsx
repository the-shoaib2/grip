import type { StoredPick } from "@grip/core";
import type { PageContextEditorMeta } from "../../hooks/usePageContextEditor";
import { GripView } from "../GripView";

export interface GripPopupViewProps {
  onContextEditRequest?: (pick: StoredPick, meta: PageContextEditorMeta) => void;
}

export function GripPopupView({ onContextEditRequest }: GripPopupViewProps) {
  return <GripView variant="popup" onContextEditRequest={onContextEditRequest} />;
}
