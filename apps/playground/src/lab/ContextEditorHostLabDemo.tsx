import { GripContextEditorHost, usePickHistory } from "@grip/devtools";

export function ContextEditorHostLabDemo() {
  const { activePick, history } = usePickHistory();

  return (
    <GripContextEditorHost>
      {(openEditor) => (
        <div class="lab-host-actions">
          <button
            type="button"
            class="grip-btn-secondary"
            disabled={!activePick}
            onClick={() => {
              if (!activePick) return;
              const pickIndex = history.findIndex((pick) => pick.id === activePick.id) + 1;
              openEditor(activePick, { pickIndex, pickCount: history.length });
            }}
          >
            Open via GripContextEditorHost
          </button>
        </div>
      )}
    </GripContextEditorHost>
  );
}
