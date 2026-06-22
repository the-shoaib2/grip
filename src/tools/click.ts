import type { GripContext } from "../context.js";
import { getElementRect } from "../selectors/css.js";

export async function clickTool(
  ctx: GripContext,
  ref: string,
): Promise<string> {
  const entry = ctx.refMap.require(ref);
  const cdp = ctx.client.getCdp();
  const rect = await getElementRect(cdp, entry.backendNodeId);
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });

  return JSON.stringify({ success: true, ref, clickedAt: { x, y } }, null, 2);
}
