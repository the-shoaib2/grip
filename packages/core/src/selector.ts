import { finder } from "@medv/finder";
import type { SelectorResult } from "./types.js";

function escapeCssIdent(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

/** Resolve the deepest element under x/y, piercing open shadow roots. */
export function deepElementFromPoint(x: number, y: number): Element | null {
  let root: Document | ShadowRoot = document;
  let el: Element | null = null;

  for (let depth = 0; depth < 32; depth++) {
    const next: Element | null = root.elementFromPoint(x, y);
    if (!next || next === el) break;
    el = next;
    if (next.shadowRoot) {
      root = next.shadowRoot;
      continue;
    }
    break;
  }
  return el;
}

/** Collect every element at x/y, piercing open shadow roots. Smallest first. */
export function elementsAtPoint(x: number, y: number): Element[] {
  const seen = new Set<Element>();
  const out: Element[] = [];

  function walk(root: Document | ShadowRoot): void {
    const list =
      typeof root.elementsFromPoint === "function"
        ? root.elementsFromPoint(x, y)
        : [root.elementFromPoint(x, y)];

    for (const node of list) {
      if (!(node instanceof Element) || seen.has(node)) continue;
      if (isGripUi(node)) continue;
      seen.add(node);
      out.push(node);
      if (node.shadowRoot) walk(node.shadowRoot);
    }
  }

  walk(document);

  return out
    .filter((el) => containsPoint(el, x, y))
    .filter((el) => isPickable(el))
    .sort((a, b) => elementArea(a) - elementArea(b));
}

/** Pick target at point; index cycles through stacked elements (smallest first). */
export function pickTargetAtPoint(
  x: number,
  y: number,
  index = 0,
): Element | null {
  const stack = elementsAtPoint(x, y);
  if (stack.length) return stack[index % stack.length] ?? null;
  return deepElementFromPoint(x, y);
}

const GRIP_PREFIX = "__grip_";

function isGripUi(el: Element): boolean {
  if (el.id?.startsWith(GRIP_PREFIX)) return true;
  return Boolean(el.closest(`[id^="${GRIP_PREFIX}"]`));
}

function containsPoint(el: Element, x: number, y: number): boolean {
  const r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function elementArea(el: Element): number {
  const r = el.getBoundingClientRect();
  return Math.max(r.width, 1) * Math.max(r.height, 1);
}

function isPickable(el: Element): boolean {
  const tag = el.tagName;
  if (tag === "HTML" || tag === "BODY") return false;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (style.pointerEvents === "none") return false;
  return true;
}

/** Prefer composed path target when it is a valid pickable leaf. */
export function elementFromComposedEvent(
  e: MouseEvent,
  cycleIndex = 0,
): Element | null {
  const path = e.composedPath();
  for (const node of path) {
    if (node instanceof Element && isPickable(node) && !isGripUi(node)) {
      const stack = elementsAtPoint(e.clientX, e.clientY);
      if (stack.length) return stack[cycleIndex % stack.length] ?? node;
      return node;
    }
  }
  return pickTargetAtPoint(e.clientX, e.clientY, cycleIndex);
}

export function generateXPath(el: Element): string {
  const segments: string[] = [];
  let current: Element | null = el;

  while (current && current.nodeType === 1) {
    const root = current.getRootNode();
    if (current.id) {
      segments.unshift(`//*[@id="${escapeCssIdent(current.id)}"]`);
      break;
    }
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    segments.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    if (root instanceof ShadowRoot) {
      segments.unshift("shadow-root");
      current = root.host;
    } else {
      current = current.parentElement;
    }
  }

  if (segments[0]?.startsWith("//")) return segments[0];
  return "/" + segments.join("/");
}

function isInShadowDom(el: Element): boolean {
  let node: Node | null = el;
  while (node) {
    if (node instanceof ShadowRoot) return true;
    node = node.parentNode;
  }
  return false;
}

export function generateSelector(el: Element): SelectorResult {
  let css: string;
  try {
    css = finder(el);
  } catch {
    css = el.tagName.toLowerCase() + (el.id ? `#${escapeCssIdent(el.id)}` : "");
  }
  const xpath = generateXPath(el);
  const inShadowDom = isInShadowDom(el);
  return {
    css: inShadowDom ? css.split(" > ").join(" >>> ") : css,
    xpath,
    inShadowDom,
  };
}

export function describeElement(el: Element) {
  const { css, xpath, inShadowDom } = generateSelector(el);
  const r = el.getBoundingClientRect();
  const innerText = (el.textContent ?? "").trim().slice(0, 80);
  return {
    tagName: el.tagName.toLowerCase(),
    css,
    xpath,
    role: el.getAttribute("role") ?? el.tagName.toLowerCase(),
    name:
      el.getAttribute("aria-label") ??
      el.getAttribute("title") ??
      el.getAttribute("name") ??
      "",
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    shadowDOM: inShadowDom,
    iframe: window !== window.top ? location.href : "none",
    innerText,
  };
}
