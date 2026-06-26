import { safeSendMessage } from "@/lib";

const levels = ["log", "info", "warn", "error", "debug"] as const;

function forward(level: string, args: unknown[]): void {
  const message = args
    .map((a) => {
      if (typeof a === "string") return a;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
  safeSendMessage({
    type: "LOG_ENTRY",
    payload: { level, message, timestamp: Date.now() },
  });
}

for (const level of levels) {
  const orig = console[level] as (...a: unknown[]) => void;
  console[level] = (...args: unknown[]) => {
    forward(level, args);
    orig.apply(console, args);
  };
}
