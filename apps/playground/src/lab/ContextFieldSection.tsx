import type { StoredPick } from "@grip/core";
import { ContextEditorPanel, usePickHistory } from "@grip/devtools";

export function ContextFieldSection({
  pick,
  onClose,
}: {
  pick: StoredPick | null;
  onClose: () => void;
}) {
  const { savePickComment, selectPick, history } = usePickHistory();

  if (!pick) {
    return (
      <p class="grip-empty-state">
        Pick an element or click context in the shell, then confirm to create or edit here.
      </p>
    );
  }

  return (
    <ContextEditorPanel
      pick={pick}
      sessionPicks={history}
      onClose={onClose}
      onSave={(comment) => savePickComment(pick.id, comment)}
      onNavigate={selectPick}
    />
  );
}
