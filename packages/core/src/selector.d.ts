import type { SelectorResult } from "./types.js";
/** Resolve the deepest element under x/y, piercing open shadow roots. */
export declare function deepElementFromPoint(x: number, y: number): Element | null;
/** Collect every element at x/y, piercing open shadow roots. Smallest first. */
export declare function elementsAtPoint(x: number, y: number): Element[];
/** Pick target at point; index cycles through stacked elements (smallest first). */
export declare function pickTargetAtPoint(x: number, y: number, index?: number): Element | null;
/** Prefer composed path target when it is a valid pickable leaf. */
export declare function elementFromComposedEvent(e: MouseEvent, cycleIndex?: number): Element | null;
export declare function generateXPath(el: Element): string;
export declare function generateSelector(el: Element): SelectorResult;
export declare function describeElement(el: Element): {
    tagName: string;
    css: string;
    xpath: string;
    role: string;
    name: string;
    rect: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
    shadowDOM: boolean;
    iframe: string;
    innerText: string;
};
//# sourceMappingURL=selector.d.ts.map