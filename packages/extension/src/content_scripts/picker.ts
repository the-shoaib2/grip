import {
  deepElementFromPoint,
  describeElement,
  elementFromComposedEvent,
  elementsAtPoint,
  pickLabel,
} from "@grip/core";
import type { PickerElementPayload } from "@grip/core";
import { isExtensionContextValid, safeSendMessage } from "@/lib";

const TRAY_ID = "__grip_tray__";
const HOVER_ID = "__grip_picker_hover__";
const STYLE_ID = "__grip_picker_style__";
const COMMENT_ID = "__grip_picker_comment__";
const HINT_ID = "__grip_picker_hint__";

const VIEWPORT_PAD = 8;
const PANEL_GAP = 8;

type PickerPhase = "idle" | "hover" | "comment";

let phase: PickerPhase = "idle";
let cycleIndex = 0;
let lastX = 0;
let lastY = 0;
let stackSize = 1;
let selectedElement: Element | null = null;

function pickLabelFor(el: Element): string {
  return pickLabel({ ...describeElement(el) } as PickerElementPayload);
}

function cleanup(): void {
  document.getElementById(HOVER_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
  document.getElementById(COMMENT_ID)?.remove();
  document.getElementById(HINT_ID)?.remove();
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("keydown", onKey, true);
  phase = "idle";
  cycleIndex = 0;
  selectedElement = null;
}

function stackAt(x: number, y: number): Element[] {
  return elementsAtPoint(x, y);
}

function targetAt(x: number, y: number, index: number): Element | null {
  const stack = stackAt(x, y);
  stackSize = Math.max(stack.length, 1);
  if (stack.length) return stack[index % stack.length] ?? null;
  return deepElementFromPoint(x, y);
}

function targetFromClick(e: MouseEvent): Element | null {
  const fromEvent = elementFromComposedEvent(e, cycleIndex);
  if (fromEvent) return fromEvent;
  return targetAt(e.clientX, e.clientY, cycleIndex);
}

function cycleSelection(dir: 1 | -1): void {
  if (stackSize <= 1) return;
  cycleIndex = (cycleIndex + dir + stackSize) % stackSize;
  const el = targetAt(lastX, lastY, cycleIndex);
  if (!el) return;
  if (phase === "comment") {
    selectedElement = el;
    highlight(el);
    const panel = document.getElementById(COMMENT_ID);
    if (panel) positionCommentPanel(panel, el);
    updateCommentLabel(el);
  } else {
    highlight(el);
  }
}

function onKey(e: KeyboardEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }

  if (e.key === "Escape") {
    if (phase === "comment") {
      e.preventDefault();
      resumeHover();
      return;
    }
    cleanup();
    return;
  }

  if (phase === "idle") return;

  if (e.key === "[" || e.key === "ArrowDown") {
    e.preventDefault();
    cycleSelection(1);
  }
  if (e.key === "]" || e.key === "ArrowUp") {
    e.preventDefault();
    cycleSelection(-1);
  }
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    *{cursor:crosshair!important}
    #${HOVER_ID},#${HINT_ID}{pointer-events:none!important}
    #${COMMENT_ID}{pointer-events:auto!important}
    #${COMMENT_ID} *{cursor:auto!important}
    #${HOVER_ID}{
      position:fixed;
      z-index:2147483646;
      box-sizing:border-box;
      border:2px dashed #3b82f6;
      border-radius:0;
      background:rgba(59,130,246,0.06);
      box-shadow:none;
      transition:top 40ms,left 40ms,width 40ms,height 40ms;
    }
  `;
  document.documentElement.appendChild(s);
}

function ensureHint(): HTMLElement {
  let hint = document.getElementById(HINT_ID);
  if (!hint) {
    hint = document.createElement("div");
    hint.id = HINT_ID;
    hint.style.cssText =
      "position:fixed;z-index:2147483647;padding:4px 8px;border-radius:9999px;background:#18181b;color:#a1a1aa;font:10px system-ui,sans-serif;border:1px solid #3f3f46;pointer-events:none;";
    document.documentElement.appendChild(hint);
  }
  return hint;
}

function highlight(el: Element): void {
  ensureStyle();
  let hover = document.getElementById(HOVER_ID);
  if (!hover) {
    hover = document.createElement("div");
    hover.id = HOVER_ID;
    document.documentElement.appendChild(hover);
  }
  const r = el.getBoundingClientRect();
  const min = 3;
  hover.style.top = `${r.top}px`;
  hover.style.left = `${r.left}px`;
  hover.style.width = `${Math.max(r.width, min)}px`;
  hover.style.height = `${Math.max(r.height, min)}px`;

  if (phase === "hover") {
    const hint = ensureHint();
    const tag = el.tagName.toLowerCase();
    const cycle = stackSize > 1 ? ` · ${cycleIndex + 1}/${stackSize}` : "";
    hint.textContent = `${tag}${cycle} · [ ] parent/child`;
    hint.style.top = `${Math.max(4, r.top - 24)}px`;
    hint.style.left = `${clamp(r.left, 4, window.innerWidth - 160)}px`;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function updateHover(x: number, y: number): void {
  lastX = x;
  lastY = y;
  const stack = stackAt(x, y);
  if (stack.length && cycleIndex >= stack.length) cycleIndex = 0;
  stackSize = Math.max(stack.length, 1);
  const el = targetAt(x, y, cycleIndex);
  if (!el || el.closest(`#${COMMENT_ID}`)) return;
  highlight(el);
}

function isGripChrome(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return Boolean(
    el.closest(`#${TRAY_ID}, #${COMMENT_ID}, #${HOVER_ID}, #${HINT_ID}`),
  );
}

function onMove(e: MouseEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if (phase !== "hover") return;
  if (isGripChrome(e.target)) return;
  updateHover(e.clientX, e.clientY);
}

function sendPick(el: Element, comment: string): void {
  const payload = { ...describeElement(el), comment: comment.trim() || undefined };
  safeSendMessage({ type: "PICKER_ELEMENT_SELECTED", payload });
}

function positionCommentPanel(panel: HTMLElement, el: Element): void {
  const anchor = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  panel.style.display = "block";
  panel.style.visibility = "hidden";
  panel.style.transform = "none";
  panel.style.bottom = "auto";
  panel.style.right = "auto";
  panel.style.left = "0";
  panel.style.top = "0";

  const panelRect = panel.getBoundingClientRect();
  const width = panelRect.width;
  const height = panelRect.height;

  let top = anchor.bottom + PANEL_GAP;
  if (top + height > vh - VIEWPORT_PAD) {
    top = anchor.top - height - PANEL_GAP;
  }
  top = clamp(top, VIEWPORT_PAD, vh - VIEWPORT_PAD - height);

  let left = anchor.left;
  if (left + width > vw - VIEWPORT_PAD) {
    left = anchor.right - width;
  }
  left = clamp(left, VIEWPORT_PAD, vw - VIEWPORT_PAD - width);

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  panel.style.visibility = "visible";
}

function updateCommentLabel(el: Element): void {
  const label = document.getElementById("__grip_comment_label__");
  if (!label) return;
  const cycle = stackSize > 1 ? ` · ${cycleIndex + 1}/${stackSize}` : "";
  label.textContent = `${pickLabelFor(el)}${cycle}`;
}

function ensureCommentPanel(): HTMLElement {
  let panel = document.getElementById(COMMENT_ID);
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = COMMENT_ID;
  panel.style.cssText =
    "position:fixed;z-index:2147483647;display:none;width:min(300px,calc(100vw - 16px));padding:10px 12px;border-radius:16px;background:#18181b;border:1px solid #3f3f46;box-shadow:0 12px 40px rgba(0,0,0,.45);font:12px system-ui,sans-serif;color:#fafafa;";
  panel.innerHTML = `
    <div id="__grip_comment_label__" style="margin-bottom:8px;font-size:11px;color:#a1a1aa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>
    <input id="__grip_comment_input__" type="text" placeholder="Context (optional)" style="width:100%;box-sizing:border-box;border-radius:9999px;border:1px solid #3f3f46;background:#09090b;color:#fafafa;padding:8px 12px;font-size:12px;outline:none" />
    <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end;flex-wrap:wrap">
      <button type="button" id="__grip_comment_done__" style="border-radius:9999px;border:none;background:#27272a;color:#d4d4d8;padding:6px 12px;font-size:11px;cursor:pointer">Done</button>
      <button type="button" id="__grip_comment_skip__" style="border-radius:9999px;border:none;background:#27272a;color:#d4d4d8;padding:6px 12px;font-size:11px;cursor:pointer">Skip</button>
      <button type="button" id="__grip_comment_save__" style="border-radius:9999px;border:none;background:#2563eb;color:#fff;padding:6px 12px;font-size:11px;cursor:pointer">Save</button>
    </div>
  `;
  document.documentElement.appendChild(panel);
  return panel;
}

function resumeHover(): void {
  document.getElementById(COMMENT_ID)?.remove();
  document.getElementById(HINT_ID)?.remove();
  selectedElement = null;
  phase = "hover";
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  updateHover(lastX, lastY);
}

function finishPick(comment: string, continueSession: boolean): void {
  if (!selectedElement) return;
  sendPick(selectedElement, comment);
  safeSendMessage({ type: "SHOW_TRAY" });

  if (continueSession) {
    resumeHover();
    return;
  }
  cleanup();
}

function showCommentPrompt(el: Element): void {
  selectedElement = el;
  phase = "comment";
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.getElementById(HINT_ID)?.remove();

  const panel = ensureCommentPanel();
  const input = panel.querySelector("#__grip_comment_input__") as HTMLInputElement;
  const save = panel.querySelector("#__grip_comment_save__") as HTMLButtonElement;
  const skip = panel.querySelector("#__grip_comment_skip__") as HTMLButtonElement;
  const done = panel.querySelector("#__grip_comment_done__") as HTMLButtonElement;

  input.value = "";
  highlight(el);
  updateCommentLabel(el);
  positionCommentPanel(panel, el);

  save.onclick = (e) => {
    e.stopPropagation();
    finishPick(input.value, true);
  };
  skip.onclick = (e) => {
    e.stopPropagation();
    finishPick("", true);
  };
  done.onclick = (e) => {
    e.stopPropagation();
    cleanup();
  };
  input.onkeydown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") finishPick(input.value, true);
    if (e.key === "Escape") resumeHover();
  };

  panel.onmousedown = (e) => e.stopPropagation();
  panel.onclick = (e) => e.stopPropagation();

  const reposition = () => {
    if (phase === "comment" && selectedElement) {
      highlight(selectedElement);
      positionCommentPanel(panel, selectedElement);
    }
  };
  window.addEventListener("resize", reposition, { once: true });
  window.addEventListener("scroll", reposition, { once: true, capture: true });

  input.focus();
}

function onClick(e: MouseEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if (phase !== "hover") return;
  if (isGripChrome(e.target)) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  lastX = e.clientX;
  lastY = e.clientY;
  const stack = stackAt(lastX, lastY);
  stackSize = Math.max(stack.length, 1);
  if (cycleIndex >= stackSize) cycleIndex = 0;

  const el = targetFromClick(e);
  if (!el) {
    cleanup();
    return;
  }
  showCommentPrompt(el);
}

function startPicker(): void {
  cleanup();
  phase = "hover";
  cycleIndex = 0;
  ensureStyle();
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if (msg.type === "START_PICKER") startPicker();
  if (msg.type === "STOP_PICKER") cleanup();
});
