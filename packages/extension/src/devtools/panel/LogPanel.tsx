import { useGripStore } from "../../stores/gripStore";
import type { LogMessagePayload } from "@grip/core";
import { Tooltip } from "../../components/Tooltip";

export function LogPanel() {
  const logs = useGripStore((s) => s.logs);
  const clearLogs = useGripStore((s) => s.clearLogs);

  return (
    <section className="mt-4 border-t pt-3" style={{ borderColor: "var(--grip-border)" }}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="grip-label">Console ({logs.length})</h2>
        <Tooltip text="Clear captured console logs">
          <button type="button" className="grip-btn-ghost" onClick={clearLogs}>
            Clear
          </button>
        </Tooltip>
      </div>
      <ul className="grip-log-list max-h-40 space-y-1 overflow-y-auto">
        {logs.length === 0 && (
          <li className="text-[11px]" style={{ color: "var(--grip-muted)" }}>
            No logs captured yet.
          </li>
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
        : "text-zinc-400";
  return (
    <li className={cls}>
      [{entry.level}] {entry.message}
    </li>
  );
}
