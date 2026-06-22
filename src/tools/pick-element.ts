import type { GripContext } from "../context.js";
import { PICKER_SCRIPT } from "../inject/highlight.js";
import {
  generateCssSelector,
  generateXPath,
  getAccessibleName,
  getElementRect,
  isInIframe,
} from "../selectors/css.js";

const PICK_TIMEOUT_MS = 60_000;

export async function pickElementTool(ctx: GripContext): Promise<string> {
  const cdp = ctx.client.getCdp();
  const page = ctx.client.getPage();

  const pickPromise = page.evaluate(PICKER_SCRIPT);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("pick_element timed out after 60s")),
      PICK_TIMEOUT_MS,
    ),
  );

  const picked = (await Promise.race([pickPromise, timeoutPromise])) as {
    tagName: string;
    innerText: string;
    rect: { top: number; left: number; width: number; height: number };
  };

  const { result } = (await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const el = document.elementFromPoint(${picked.rect.left + picked.rect.width / 2}, ${picked.rect.top + picked.rect.height / 2});
      return el;
    })()`,
    returnByValue: false,
  })) as { result: { objectId?: string } };

  if (!result.objectId) {
    throw new Error("Could not resolve picked element");
  }

  const { node } = (await cdp.send("DOM.describeNode", {
    objectId: result.objectId,
  })) as { node: { backendNodeId?: number } };

  if (!node.backendNodeId) {
    throw new Error("Picked element has no backendNodeId");
  }

  const backendNodeId = node.backendNodeId;
  const ref = ctx.refMap.assign(backendNodeId);
  const { selector: cssSelector, inShadowDom } = await generateCssSelector(
    cdp,
    backendNodeId,
  );
  const xpathSelector = await generateXPath(cdp, backendNodeId);
  const { role, name } = await getAccessibleName(cdp, backendNodeId);
  const rect = await getElementRect(cdp, backendNodeId);
  const iframe = await isInIframe(cdp, backendNodeId);

  return JSON.stringify(
    {
      ref,
      cssSelector,
      xpathSelector,
      role,
      name,
      tagName: picked.tagName,
      text: picked.innerText,
      rect,
      shadowDOM: inShadowDom,
      iframe: iframe === "none" ? "none" : iframe,
    },
    null,
    2,
  );
}
