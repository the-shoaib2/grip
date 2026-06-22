import type { GripContext } from "../context.js";
import { HIGHLIGHT_SCRIPT } from "../inject/highlight.js";
import { getElementRect } from "../selectors/css.js";

export async function highlightTool(
  ctx: GripContext,
  ref: string,
): Promise<string> {
  const entry = ctx.refMap.require(ref);
  const cdp = ctx.client.getCdp();
  const rect = await getElementRect(cdp, entry.backendNodeId);

  await cdp.send("Runtime.evaluate", { expression: HIGHLIGHT_SCRIPT });
  await cdp.send("Runtime.evaluate", {
    expression: `window.__gripHighlight(${JSON.stringify(rect)})`,
  });

  return JSON.stringify({ success: true, ref, rect }, null, 2);
}
