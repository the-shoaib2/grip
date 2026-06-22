import type { GripContext } from "../context.js";
import type { LogLevel } from "../types.js";

export async function readLogsTool(
  ctx: GripContext,
  level?: LogLevel,
): Promise<string> {
  const entries = ctx.logBuffer.read(level ?? "all");
  return JSON.stringify(entries, null, 2);
}
