import type { StoredPick } from "grip-dev";
import {
  SessionHistoryList,
  SessionPickComposer,
  SessionTabBar,
  usePickHistory,
} from "@grip/devtools";
import { useState } from "preact/hooks";

export function PickHistoryLabDemo({
  onContextEditRequest,
}: {
  onContextEditRequest?: (
    pick: StoredPick,
    meta: { pickIndex: number; pickCount: number },
  ) => void;
}) {
  const [historyView, setHistoryView] = useState(false);
  const {
    history,
    sessionGroups,
    sessionOrder,
    activeSessionId,
    activePick,
    selectPick,
    savePickComment,
    deleteSession,
    switchSession,
    newSession,
  } = usePickHistory();

  return (
    <div class="lab-history-demo">
      <SessionTabBar
        groups={sessionGroups}
        sessionOrder={sessionOrder}
        activeSessionId={activeSessionId}
        historyView={historyView}
        onSelectSession={(id) => {
          setHistoryView(false);
          void switchSession(id);
        }}
        onCloseSession={(id) => void deleteSession(id)}
        onNewSession={() => {
          setHistoryView(false);
          void newSession();
        }}
        onToggleHistoryView={() => setHistoryView((open) => !open)}
      />
      {historyView ? (
        <SessionHistoryList
          groups={sessionGroups}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            void switchSession(id);
            setHistoryView(false);
          }}
          onDeleteSession={(id) => void deleteSession(id)}
        />
      ) : (
        <div class="grip-session-stack">
          {activePick ? (
            <SessionPickComposer
              pick={activePick}
              pickIndex={history.findIndex((p) => p.id === activePick.id) + 1}
              pickCount={history.length}
              onCommentChange={(comment) => savePickComment(activePick.id, comment)}
              onNavigate={selectPick}
              onEditRequest={onContextEditRequest}
            />
          ) : (
            <p class="grip-empty-state">No picks yet</p>
          )}
        </div>
      )}
    </div>
  );
}
