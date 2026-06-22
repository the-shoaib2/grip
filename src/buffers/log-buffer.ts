import type { CDPSession } from "puppeteer-core";
import type { LogEntry } from "../types.js";

const MAX_ENTRIES = 500;

export class LogBuffer {
  private entries: LogEntry[] = [];
  private enabled = false;

  async enable(cdp: CDPSession): Promise<void> {
    if (this.enabled) return;
    await cdp.send("Log.enable");
    cdp.on("Log.entryAdded", (params) => {
      const entry = params.entry as unknown as Record<string, unknown>;
      const level = mapLevel(String(entry.level ?? entry.source ?? "log"));
      const args = entry.args as Array<{ value?: unknown }> | undefined;
      let message = String(entry.text ?? "");
      if (!message && args) {
        message = args
          .map((a) => (a.value !== undefined ? String(a.value) : ""))
          .join(" ");
      }
      const stack = entry.stackTrace as
        | { callFrames?: Array<{ url?: string; lineNumber?: number }> }
        | undefined;
      let stackTrace: string | undefined;
      if (stack?.callFrames?.length) {
        const f = stack.callFrames[0];
        stackTrace = `${f.url ?? ""}:${f.lineNumber ?? 0}`;
      }
      this.push({
        level,
        message,
        stackTrace,
        timestamp: Date.now(),
      });
    });

    cdp.on(
      "Runtime.consoleAPICalled",
      (params: {
        type: string;
        args: Array<{ value?: unknown; description?: string }>;
        stackTrace?: {
          callFrames?: Array<{ url?: string; lineNumber?: number }>;
        };
      }) => {
        const message = params.args
          .map((a) =>
            a.value !== undefined
              ? String(a.value)
              : (a.description ?? ""),
          )
          .join(" ");
        let stackTrace: string | undefined;
        if (params.stackTrace?.callFrames?.length) {
          const f = params.stackTrace.callFrames[0];
          stackTrace = `${f.url ?? ""}:${f.lineNumber ?? 0}`;
        }
        this.push({
          level: mapLevel(params.type),
          message,
          stackTrace,
          timestamp: Date.now(),
        });
      },
    );

    this.enabled = true;
  }

  private push(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.shift();
    }
  }

  read(level?: "log" | "warn" | "error" | "all"): LogEntry[] {
    if (!level || level === "all") return [...this.entries];
    if (level === "log") {
      return this.entries.filter((e) =>
        ["log", "info", "debug"].includes(e.level),
      );
    }
    return this.entries.filter((e) => e.level === level);
  }

  clear(): void {
    this.entries = [];
  }
}

function mapLevel(raw: string): LogEntry["level"] {
  const l = raw.toLowerCase();
  if (l === "warning" || l === "warn") return "warn";
  if (l === "error") return "error";
  if (l === "debug") return "debug";
  if (l === "info") return "info";
  return "log";
}
