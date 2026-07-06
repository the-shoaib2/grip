import { useGripStore } from "@devtools/store/gripStore";
import type { LogMessagePayload } from "grip-dev";
import { Tooltip } from "@devtools/components";

export function LogPanel() {
  const logs = useGripStore((s) => s.logs);
  const clearLogs = useGripStore((s) => s.clearLogs);

  return (
    <section className="grip-log-section">
      <div className="grip-log-section-header">
        <h2 className="grip-label">Console ({logs.length})</h2>
        <Tooltip text="Clear captured console logs">
          <button type="button" className="grip-btn-ghost" onClick={clearLogs}>
            Clear
          </button>
        </Tooltip>
      </div>
      <ul className="grip-log-list">
        {logs.length === 0 && (
          <li className="grip-empty-state">No logs captured yet.</li>
        )}
        {logs.map((entry, i) => (
          <LogLine key={`${entry.timestamp}-${i}`} entry={entry} />
        ))}
      </ul>
    </section>
  );
}

function LogLine({ entry }: { entry: LogMessagePayload }) {
  const cls =
    entry.level === "error"
      ? "grip-log-error"
      : entry.level === "warn"
        ? "grip-log-warn"
        : "grip-log-muted";
  return (
    <li className={cls}>
      [{entry.level}] {entry.message}
    </li>
  );
}
