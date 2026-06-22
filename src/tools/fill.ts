import type { GripContext } from "../context.js";

export async function fillTool(
  ctx: GripContext,
  ref: string,
  value: string,
): Promise<string> {
  const entry = ctx.refMap.require(ref);
  const cdp = ctx.client.getCdp();

  const { object } = await cdp.send("DOM.resolveNode", {
    backendNodeId: entry.backendNodeId,
  });
  if (!object.objectId) {
    throw new Error(`Cannot resolve ref ${ref} to DOM node`);
  }

  await cdp.send("DOM.focus", { backendNodeId: entry.backendNodeId });

  await cdp.send("Runtime.callFunctionOn", {
    objectId: object.objectId,
    functionDeclaration: `function() {
      if (this.isContentEditable) {
        this.textContent = '';
      } else if ('value' in this) {
        this.value = '';
      }
    }`,
  });

  await cdp.send("Input.insertText", { text: value });

  return JSON.stringify({ success: true, ref, value }, null, 2);
}
