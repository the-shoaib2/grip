import { describe, expect, it, beforeEach } from "vitest";
import {
  elementFromComposedEvent,
  elementsAtPoint,
  generateXPath,
  pickTargetAtPoint,
} from "./selector.js";

function mount(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

function rect(el: Element, box: { top: number; left: number; width: number; height: number }): void {
  el.getBoundingClientRect = () =>
    ({
      top: box.top,
      left: box.left,
      right: box.left + box.width,
      bottom: box.top + box.height,
      width: box.width,
      height: box.height,
      x: box.left,
      y: box.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

function mockElementsFromPoint(map: Map<number, Element[]>): void {
  document.elementsFromPoint = ((x: number, y: number) => {
    const key = x * 10_000 + y;
    return map.get(key) ?? [];
  }) as typeof document.elementsFromPoint;
}

function clickEvent(x: number, y: number, target?: Element): MouseEvent {
  const event = new MouseEvent("click", { clientX: x, clientY: y, bubbles: true });
  if (target) Object.defineProperty(event, "target", { value: target });
  return event;
}

/** Picker hover path (createPicker targetAt) — must match click resolution. */
function hoverTargetAt(x: number, y: number, cycleIndex: number): Element | null {
  const stack = elementsAtPoint(x, y);
  if (stack.length) return stack[cycleIndex % stack.length] ?? null;
  return pickTargetAtPoint(x, y, cycleIndex);
}

/** Picker click path (createPicker targetFromClick). */
function clickTargetFromEvent(e: MouseEvent, cycleIndex: number): Element | null {
  return elementFromComposedEvent(e, cycleIndex);
}

function expectHoverClickCrossMatch(
  x: number,
  y: number,
  stack: Element[],
  options?: { eventTarget?: Element; maxCycles?: number },
): void {
  mockElementsFromPoint(new Map([[x * 10_000 + y, stack]]));
  const cycles = options?.maxCycles ?? Math.max(stack.length, 1);
  for (let cycleIndex = 0; cycleIndex < cycles; cycleIndex++) {
    const hover = hoverTargetAt(x, y, cycleIndex);
    const click = clickTargetFromEvent(clickEvent(x, y, options?.eventTarget), cycleIndex);
    expect(click, `cycle ${cycleIndex} at (${x}, ${y})`).toBe(hover);
  }
}

describe("generateXPath", () => {
  it("uses id when present", () => {
    const el = document.createElement("div");
    el.id = "main";
    expect(generateXPath(el)).toBe('//*[@id="main"]');
  });
});

describe("elementsAtPoint", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("preserves hit-test order (topmost first)", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);

    rect(parent, { top: 0, left: 0, width: 200, height: 200 });
    rect(child, { top: 50, left: 50, width: 40, height: 40 });

    mockElementsFromPoint(new Map([[50_0050, [child, parent]]]));

    expect(elementsAtPoint(50, 50)).toEqual([child, parent]);
  });

  it("excludes grip UI overlays", () => {
    const target = document.createElement("button");
    const overlay = document.createElement("div");
    overlay.id = "__grip_tray";
    document.body.append(target, overlay);

    rect(target, { top: 0, left: 0, width: 80, height: 32 });
    rect(overlay, { top: 0, left: 0, width: 80, height: 32 });

    mockElementsFromPoint(new Map([[40_0016, [overlay, target]]]));

    expect(elementsAtPoint(40, 16)).toEqual([target]);
  });

  it("skips non-pickable elements", () => {
    const visible = document.createElement("p");
    const hidden = document.createElement("p");
    hidden.style.display = "none";
    document.body.append(visible, hidden);

    rect(visible, { top: 0, left: 0, width: 100, height: 20 });

    mockElementsFromPoint(new Map([[50_0010, [hidden, visible]]]));

    expect(elementsAtPoint(50, 10)).toEqual([visible]);
  });
});

describe("pickTargetAtPoint", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns topmost element at index 0", () => {
    const parent = document.createElement("div");
    const child = document.createElement("label");
    parent.appendChild(child);
    document.body.appendChild(parent);

    rect(parent, { top: 0, left: 0, width: 120, height: 120 });
    rect(child, { top: 10, left: 10, width: 80, height: 24 });

    mockElementsFromPoint(new Map([[60_0022, [child, parent]]]));

    expect(pickTargetAtPoint(60, 22, 0)?.tagName).toBe("LABEL");
    expect(pickTargetAtPoint(60, 22, 1)?.tagName).toBe("DIV");
  });

  it("wraps cycle index through the stack", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);

    rect(parent, { top: 0, left: 0, width: 100, height: 100 });
    rect(child, { top: 20, left: 20, width: 40, height: 40 });

    mockElementsFromPoint(new Map([[40_0040, [child, parent]]]));

    expect(pickTargetAtPoint(40, 40, 2)).toBe(child);
  });
});

describe("elementFromComposedEvent", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("matches pickTargetAtPoint for the same coordinates", () => {
    const root = mount(`
      <div id="wrap">
        <label for="email">Email</label>
        <input id="email" type="email" />
      </div>
    `);
    const label = root.querySelector("label")!;
    const input = root.querySelector("input")!;

    rect(label, { top: 10, left: 10, width: 60, height: 20 });
    rect(input, { top: 40, left: 10, width: 160, height: 28 });
    rect(root, { top: 0, left: 0, width: 200, height: 80 });

    mockElementsFromPoint(new Map([[40_0020, [label, root]]]));

    const event = new MouseEvent("click", {
      clientX: 40,
      clientY: 20,
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: label });

    expect(elementFromComposedEvent(event, 0)).toBe(label);
    expect(elementFromComposedEvent(event, 0)).toBe(pickTargetAtPoint(40, 20, 0));
    expect(elementFromComposedEvent(event, 1)).toBe(pickTargetAtPoint(40, 20, 1));
  });

  it("falls back to event target when hit stack is empty", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    rect(button, { top: 0, left: 0, width: 80, height: 32 });

    mockElementsFromPoint(new Map());

    const event = new MouseEvent("click", {
      clientX: 40,
      clientY: 16,
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: button });

    expect(elementFromComposedEvent(event, 0)).toBe(button);
  });
});
