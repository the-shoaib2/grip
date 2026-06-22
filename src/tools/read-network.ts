import type { GripContext } from "../context.js";

export async function readNetworkTool(
  ctx: GripContext,
  filter?: { url?: string; method?: string; status?: number },
): Promise<string> {
  const entries = ctx.networkBuffer.read(filter);
  return JSON.stringify(entries, null, 2);
}
