import type { CDPSession } from "puppeteer-core";
import type { ElementRect } from "../types.js";

export async function generateCssSelector(
  cdp: CDPSession,
  backendNodeId: number,
): Promise<{ selector: string; inShadowDom: boolean }> {
  const { object } = await cdp.send("DOM.resolveNode", { backendNodeId });
  if (!object.objectId) return { selector: `[data-grip-node="${backendNodeId}"]`, inShadowDom: false };

  const result = (await cdp.send("Runtime.callFunctionOn", {
    objectId: object.objectId,
    functionDeclaration: `function() {
      function path(el) {
        if (!el || el.nodeType !== 1) return '';
        const parts = [];
        let current = el;
        let inShadow = false;
        while (current) {
          if (current.nodeType === 11) {
            inShadow = true;
            current = current.host;
            continue;
          }
          let part = current.tagName.toLowerCase();
          if (current.id) {
            part += '#' + CSS.escape(current.id);
            parts.unshift(part);
            break;
          }
          const parent = current.parentElement || (current.getRootNode().host ?? null);
          if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
            if (siblings.length > 1) {
              const idx = siblings.indexOf(current) + 1;
              part += ':nth-of-type(' + idx + ')';
            }
          }
          parts.unshift(part);
          current = parent;
        }
        return { path: parts.join(' > '), inShadow };
      }
      return path(this);
    }`,
    returnByValue: true,
  })) as { result: { value?: { path: string; inShadow: boolean } } };

  const val = result.result.value;
  if (!val?.path) return { selector: `[data-grip-node="${backendNodeId}"]`, inShadowDom: false };
  const selector = val.inShadow ? val.path.split(" > ").join(" >>> ") : val.path;
  return { selector, inShadowDom: val.inShadow };
}

export async function generateXPath(
  cdp: CDPSession,
  backendNodeId: number,
): Promise<string> {
  const { object } = await cdp.send("DOM.resolveNode", { backendNodeId });
  if (!object.objectId) return `//*[@data-grip-node="${backendNodeId}"]`;

  const result = (await cdp.send("Runtime.callFunctionOn", {
    objectId: object.objectId,
    functionDeclaration: `function() {
      function getXPath(el) {
        if (!el) return '';
        if (el.id) return '//*[@id="' + el.id + '"]';
        const parts = [];
        let current = el;
        while (current && current.nodeType === 1) {
          let index = 1;
          let sibling = current.previousSibling;
          while (sibling) {
            if (sibling.nodeType === 1 && sibling.tagName === current.tagName) index++;
            sibling = sibling.previousSibling;
          }
          parts.unshift(current.tagName.toLowerCase() + '[' + index + ']');
          current = current.parentElement;
        }
        return '/' + parts.join('/');
      }
      return getXPath(this);
    }`,
    returnByValue: true,
  })) as { result: { value?: string } };

  return result.result.value ?? `//*[@data-grip-node="${backendNodeId}"]`;
}

export async function getElementRect(
  cdp: CDPSession,
  backendNodeId: number,
): Promise<ElementRect> {
  const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId });
  const content = model.content;
  const xs = [content[0], content[2], content[4], content[6]];
  const ys = [content[1], content[3], content[5], content[7]];
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { top, left, width: right - left, height: bottom - top };
}

export async function getAccessibleName(
  cdp: CDPSession,
  backendNodeId: number,
): Promise<{ role: string; name: string }> {
  const { nodes } = (await cdp.send("Accessibility.getPartialAXTree", {
    backendNodeId,
    fetchRelatives: false,
  })) as {
    nodes: Array<{
      role?: { value: string };
      name?: { value: string };
    }>;
  };
  const node = nodes[0];
  return {
    role: node?.role?.value ?? "generic",
    name: node?.name?.value ?? "",
  };
}

export async function isInIframe(
  cdp: CDPSession,
  backendNodeId: number,
): Promise<string> {
  try {
    const { object } = await cdp.send("DOM.resolveNode", { backendNodeId });
    if (!object.objectId) return "none";

    const result = (await cdp.send("Runtime.callFunctionOn", {
      objectId: object.objectId,
      functionDeclaration: `function() {
        let win = this.ownerDocument?.defaultView;
        if (!win) return 'none';
        if (win !== win.top) {
          try { return win.location.href; } catch { return 'cross-origin'; }
        }
        return 'none';
      }`,
      returnByValue: true,
    })) as { result: { value?: string } };

    return result.result.value ?? "none";
  } catch {
    return "none";
  }
}
