import type { GripContext } from "../context.js";
import { buildA11ySnapshot } from "../snapshot/a11y-tree.js";
import { getFrameTree } from "../cdp/frames.js";

export async function snapshotTool(
  ctx: GripContext,
  frameId?: string,
): Promise<string> {
  ctx.checkSnapshotDebounce();
  const cdp = ctx.client.getCdp();
  const effectiveFrameId = frameId ?? ctx.client.getCurrentFrameId() ?? undefined;

  if (frameId) {
    ctx.client.setCurrentFrameId(frameId);
  }

  const yaml = await buildA11ySnapshot(cdp, ctx.refMap, effectiveFrameId);
  const title = await ctx.client.getTitle();
  const url = await ctx.client.getUrl();
  const frames = await getFrameTree(cdp);

  return JSON.stringify(
    {
      yaml,
      refs: ctx.refMap.getAll(),
      title,
      url,
      frames: frames.map((f) => ({ id: f.id, url: f.url, name: f.name })),
    },
    null,
    2,
  );
}
