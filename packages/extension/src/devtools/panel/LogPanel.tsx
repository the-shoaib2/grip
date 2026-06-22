import { useGripStore } from "../../stores/gripStore";
import type { LogMessagePayload } from "@grip/core";

export function LogPanel() {
  const logs = useGripStore((s) => s.logs);
  const clearLogs = useGripStore((s) => s.clearLogs);

  return (
    <section className="mt-4 border-t border-zinc-800 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="grip-label">Console ({logs.length})</h2>
        <button
          type="button"
          className="text-[10px] text-blue-400 hover:underline"
          onClick={clearLogs}
        >
          Clear
        </button>
      </div>
      <ul className="max-h-40 space-y-1 overflow-y-auto">
        {logs.length === 0 && (
          <li className="text-zinc-600">No logs captured yet.</li>
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
