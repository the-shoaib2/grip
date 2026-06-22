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

/** Prefer composedPath for accurate target including shadow DOM. */
export function elementFromComposedEvent(e: MouseEvent): Element | null {
  for (const node of e.composedPath()) {
    if (node instanceof Element) return node;
  }
  return deepElementFromPoint(e.clientX, e.clientY);
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
