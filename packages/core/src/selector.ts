import { finder } from "@medv/finder";
import type { SelectorResult } from "./types/a11y.js";
import type { FrameworkContext } from "./types/framework.js";

function escapeCssIdent(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
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

function isPickable(el: Element): boolean {
  const tag = el.tagName;
  if (tag === "HTML" || tag === "BODY") return false;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (parseFloat(style.opacity) === 0) return false;
  if (style.pointerEvents === "none") return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  return true;
}

function elementsFromPointInRoot(
  root: Document | ShadowRoot,
  x: number,
  y: number,
): Element[] {
  if (typeof root.elementsFromPoint === "function") {
    return root.elementsFromPoint(x, y).filter((node): node is Element => node instanceof Element);
  }
  const hit = root.elementFromPoint(x, y);
  return hit instanceof Element ? [hit] : [];
}

function collectElementsAtPoint(
  x: number,
  y: number,
  seen: Set<Element>,
  out: Element[],
): void {
  function consider(node: Element): void {
    if (seen.has(node) || isGripUi(node)) return;
    seen.add(node);
    if (!isPickable(node) || !containsPoint(node, x, y)) return;
    out.push(node);
  }

  function walk(root: Document | ShadowRoot): void {
    for (const node of elementsFromPointInRoot(root, x, y)) {
      if (node.shadowRoot) {
        walk(node.shadowRoot);
      }
      consider(node);
    }
  }

  walk(document);
}

/** Resolve the deepest pickable element under x/y, piercing open shadow roots. */
export function deepElementFromPoint(x: number, y: number): Element | null {
  const stack = elementsAtPoint(x, y);
  if (stack.length) return stack[0] ?? null;

  let root: Document | ShadowRoot = document;
  let el: Element | null = null;

  for (let depth = 0; depth < 32; depth++) {
    const next: Element | null = root.elementFromPoint(x, y);
    if (!(next instanceof Element) || next === el) break;
    if (isGripUi(next)) break;
    el = next;
    if (next.shadowRoot) {
      root = next.shadowRoot;
      continue;
    }
    break;
  }

  if (el && isPickable(el) && containsPoint(el, x, y)) return el;
  return null;
}

/**
 * Collect every pickable element at x/y in hit-test order (topmost first).
 * Pierces open shadow roots. Use cycleIndex to walk up the stack with [ ].
 */
export function elementsAtPoint(x: number, y: number): Element[] {
  const seen = new Set<Element>();
  const out: Element[] = [];
  collectElementsAtPoint(x, y, seen, out);
  return out;
}

/** Pick target at point; index cycles through stacked elements (topmost first). */
export function pickTargetAtPoint(
  x: number,
  y: number,
  index = 0,
): Element | null {
  const stack = elementsAtPoint(x, y);
  if (stack.length) return stack[index % stack.length] ?? null;
  return deepElementFromPoint(x, y);
}

/** Resolve the clicked element using the same stack order as hover/cycle. */
export function elementFromComposedEvent(
  e: MouseEvent,
  cycleIndex = 0,
): Element | null {
  const x = e.clientX;
  const y = e.clientY;
  const stack = elementsAtPoint(x, y);

  if (stack.length) {
    return stack[cycleIndex % stack.length] ?? null;
  }

  const target = e.target instanceof Element ? e.target : null;
  if (target && isPickable(target) && !isGripUi(target) && containsPoint(target, x, y)) {
    return target;
  }

  return deepElementFromPoint(x, y);
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

interface ReactFiber {
  _debugSource?: {
    fileName: string;
    lineNumber: number;
  };
  return?: ReactFiber | null;
  type?: string | { displayName?: string; name?: string };
}

interface SvelteMeta {
  loc?: {
    file?: string;
    line?: number;
  };
}

interface VueVNode {
  type?: {
    __file?: string;
  };
  __file?: string;
}

interface FrameworkElement extends Element {
  [key: string]: unknown;
  __vnode?: VueVNode;
  __vue__?: VueVNode;
  __svelte_meta?: SvelteMeta;
}

function reactComponentName(fiber: ReactFiber | null | undefined): string | undefined {
  while (fiber) {
    const t = fiber.type;
    if (typeof t === "function" || typeof t === "object") {
      const named = (t as { displayName?: string; name?: string }).displayName
        ?? (t as { displayName?: string; name?: string }).name;
      if (named && named !== "Fragment") return named;
    }
    fiber = fiber.return ?? null;
  }
  return undefined;
}

function getFrameworkContext(el: Element): FrameworkContext | null {
  const fwEl = el as FrameworkElement;

  // 1. React (Fiber) detection
  const fiberKey = Object.keys(fwEl).find(
    (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")
  );
  if (fiberKey) {
    const fiber = fwEl[fiberKey] as ReactFiber | undefined;
    let current: ReactFiber | null | undefined = fiber;
    while (current) {
      if (current._debugSource) {
        return {
          framework: "React",
          file: current._debugSource.fileName,
          line: current._debugSource.lineNumber,
          componentName: reactComponentName(current),
        };
      }
      current = current.return;
    }
    return { framework: "React" };
  }

  // 2. Vue (Vnode) detection
  if (fwEl.__vnode || fwEl.__vue__) {
    const vnode = fwEl.__vnode || fwEl.__vue__;
    const file = vnode?.type?.__file || vnode?.__file;
    if (file) {
      return {
        framework: "Vue",
        file,
      };
    }
    return { framework: "Vue" };
  }

  // 3. Angular detection
  const ngContextKey = Object.keys(fwEl).find((k) => k.startsWith("__ngContext__"));
  if (ngContextKey) {
    return {
      framework: "Angular",
      file: fwEl.getAttribute("ng-reflect-file") ?? undefined,
    };
  }

  // 4. Svelte detection
  if (fwEl.__svelte_meta) {
    const meta = fwEl.__svelte_meta;
    if (meta.loc && meta.loc.file) {
      return {
        framework: "Svelte",
        file: meta.loc.file,
        line: meta.loc.line,
      };
    }
    return { framework: "Svelte" };
  }

  return null;
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
    frameworkContext: getFrameworkContext(el),
  };
}
