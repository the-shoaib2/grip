import type { GripContext } from "../context.js";

export async function screenshotTool(
  ctx: GripContext,
  selector?: string,
): Promise<string> {
  const cdp = ctx.client.getCdp();
  const page = ctx.client.getPage();

  let clip: { x: number; y: number; width: number; height: number } | undefined;

  if (selector) {
    const entry = ctx.refMap.get(selector);
    if (entry) {
      const { model } = await cdp.send("DOM.getBoxModel", {
        backendNodeId: entry.backendNodeId,
      });
      const content = model.content;
      const xs = [content[0], content[2], content[4], content[6]];
      const ys = [content[1], content[3], content[5], content[7]];
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const width = Math.max(...xs) - x;
      const height = Math.max(...ys) - y;
      clip = { x, y, width, height };
    }
  }

  const screenshot = await page.screenshot({
    encoding: "base64",
    fullPage: !clip,
    clip,
    type: "png",
  });

  return JSON.stringify(
    {
      format: "png",
      base64: screenshot,
    },
    null,
    2,
  );
}
