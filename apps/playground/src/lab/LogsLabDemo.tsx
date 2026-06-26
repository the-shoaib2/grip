import { LogPanel, useGripStore } from "@grip/devtools";
import { useEffect, useRef } from "preact/hooks";

export function LogsLabDemo() {
  const addLog = useGripStore((s) => s.addLog);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || useGripStore.getState().logs.length > 0) return;
    seeded.current = true;
    const now = Date.now();
    addLog({ level: "info", message: "Grip lab initialized", timestamp: now });
    addLog({ level: "warn", message: "Sample warning from fixture page", timestamp: now + 1 });
    addLog({ level: "error", message: "Sample error for styling preview", timestamp: now + 2 });
  }, [addLog]);

  return <LogPanel />;
}
