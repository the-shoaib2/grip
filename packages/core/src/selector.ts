import { finder } from "@medv/finder";
import type { SelectorResult } from "./types.js";

export function generateXPath(el: Element): string {
  if (el.id) return `//*[@id="${el.id}"]`;
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current.nodeType === 1) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    current = current.parentElement;
  }
  return `/${parts.join("/")}`;
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
  const css = finder(el);
  const xpath = generateXPath(el);
  const inShadowDom = isInShadowDom(el);
  return {
    css: inShadowDom ? css.replace(/ > /g, " >>> ") : css,
    xpath,
    inShadowDom,
  };
}
