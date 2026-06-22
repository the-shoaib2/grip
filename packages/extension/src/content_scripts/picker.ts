import {
  deepElementFromPoint,
  describeElement,
  elementFromComposedEvent,
  elementsAtPoint,
} from "@grip/core";
import type { PickerStartPayload } from "@grip/core";
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
let sessionPickCount = 0;
let panelManuallyPlaced = false;
let panelDrag: {
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
} | null = null;

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
  panelManuallyPlaced = false;
  panelDrag = null;
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
    if (panel && !panelManuallyPlaced) positionCommentPanel(panel, el);
    updateCommentBadges(el);
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
    .grip-picker-panel{
      width:min(320px,calc(100vw - 16px));
      padding:10px 12px;
      border-radius:16px;
      background:#18181b;
      border:1px solid #3f3f46;
      box-shadow:0 12px 40px rgba(0,0,0,.45);
      font:12px system-ui,sans-serif;
      color:#fafafa;
    }
    .grip-picker-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      margin-bottom:8px;
      cursor:grab;
      user-select:none;
      touch-action:none;
    }
    .grip-picker-header.grip-picker-dragging{cursor:grabbing}
    .grip-picker-session{
      font-size:11px;
      font-weight:600;
      color:#e4e4e7;
    }
    .grip-picker-hint{
      font-size:10px;
      color:#71717a;
      white-space:nowrap;
    }
    .grip-context-field{
      display:flex;
      flex-direction:column;
      gap:6px;
      margin-bottom:8px;
    }
    .grip-context-badges{
      display:flex;
      flex-wrap:wrap;
      gap:4px;
      align-items:center;
    }
    .grip-el-badge{
      display:inline-flex;
      align-items:center;
      border:none;
      border-radius:9999px;
      padding:2px 8px;
      font-size:10px;
      font-weight:500;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      text-transform:lowercase;
      line-height:1.3;
      background:transparent;
      color:#a1a1aa;
    }
    .grip-context-input{
      width:100%;
      box-sizing:border-box;
      min-height:44px;
      max-height:120px;
      overflow-y:auto;
      resize:none;
      border:none;
      border-radius:12px;
      background:#09090b;
      color:#fafafa;
      padding:8px 12px;
      font:12px/1.45 system-ui,sans-serif;
      outline:none;
    }
    .grip-context-input:focus{outline:none}
    .grip-context-input::placeholder{color:#71717a}
    .grip-picker-actions{
      display:flex;
      gap:6px;
      justify-content:flex-end;
      flex-wrap:wrap;
    }
    .grip-picker-actions button{
      border-radius:9999px;
      border:none;
      padding:6px 12px;
      font-size:11px;
      cursor:pointer;
    }
    #__grip_comment_done__,#__grip_comment_skip__{background:#27272a;color:#d4d4d8}
    #__grip_comment_save__{background:#2563eb;color:#fff}
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
  if (phase !== "hover" && phase !== "comment") return;
  if (isGripChrome(e.target)) return;
  updateHover(e.clientX, e.clientY);
}

function sendPick(el: Element, comment: string): void {
  const payload = { ...describeElement(el), comment: comment.trim() || undefined };
  safeSendMessage({ type: "PICKER_ELEMENT_SELECTED", payload });
}

function positionCommentPanel(panel: HTMLElement, el: Element, force = false): void {
  if (panelManuallyPlaced && !force) return;

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

function updateCommentBadges(el: Element): void {
  const badges = document.getElementById("__grip_comment_badges__");
  const sessionLabel = document.getElementById("__grip_session_label__");
  if (!badges) return;

  const desc = describeElement(el);
  const tag = desc.tagName.toLowerCase();
  const role = desc.role?.toLowerCase() ?? "";
  const cycle = stackSize > 1 ? ` · ${cycleIndex + 1}/${stackSize}` : "";

  let html = `<span class="grip-el-badge">${tag}</span>`;
  if (role && role !== tag) {
    html += `<span class="grip-el-badge">${role}</span>`;
  }
  badges.innerHTML = html;

  if (sessionLabel) {
    sessionLabel.textContent = `Pick ${sessionPickCount + 1} in session${cycle}`;
  }
}

function ensureCommentPanel(): HTMLElement {
  let panel = document.getElementById(COMMENT_ID);
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = COMMENT_ID;
  panel.className = "grip-picker-panel";
  panel.style.cssText = "position:fixed;z-index:2147483647;display:none;";
  panel.innerHTML = `
    <div class="grip-picker-header">
      <span id="__grip_session_label__" class="grip-picker-session">Pick 1 in session</span>
      <span class="grip-picker-hint">[ ] cycle · Ctrl+Enter save</span>
    </div>
    <div class="grip-context-field">
      <div id="__grip_comment_badges__" class="grip-context-badges"></div>
      <textarea id="__grip_comment_input__" class="grip-context-input" placeholder="Add context for this element…" rows="2"></textarea>
    </div>
    <div class="grip-picker-actions">
      <button type="button" id="__grip_comment_done__">Done</button>
      <button type="button" id="__grip_comment_skip__">Skip</button>
      <button type="button" id="__grip_comment_save__">Save</button>
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
  sessionPickCount += 1;

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
  const input = panel.querySelector("#__grip_comment_input__") as HTMLTextAreaElement;
  const save = panel.querySelector("#__grip_comment_save__") as HTMLButtonElement;
  const skip = panel.querySelector("#__grip_comment_skip__") as HTMLButtonElement;
  const done = panel.querySelector("#__grip_comment_done__") as HTMLButtonElement;

  input.value = "";
  highlight(el);
  updateCommentBadges(el);
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
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      finishPick(input.value, true);
    }
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

function startPicker(payload?: PickerStartPayload): void {
  cleanup();
  sessionPickCount = payload?.sessionPickCount ?? 0;
  phase = "hover";
  cycleIndex = 0;
  ensureStyle();
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if (msg.type === "START_PICKER") {
    startPicker(msg.payload as PickerStartPayload | undefined);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "STOP_PICKER") {
    cleanup();
    sendResponse({ ok: true });
    return true;
  }
});
