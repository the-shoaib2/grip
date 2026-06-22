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
const SELECTED_ID = "__grip_picker_selected__";

const VIEWPORT_PAD = 8;
const PANEL_GAP = 8;

type PickerPhase = "idle" | "hover" | "comment";

interface PendingPick {
  el: Element;
  css: string;
  tag: string;
  role: string;
}

let phase: PickerPhase = "idle";
let cycleIndex = 0;
let lastX = 0;
let lastY = 0;
let stackSize = 1;
let pendingElements: PendingPick[] = [];
let activePendingIndex = 0;
let sessionPickCount = 0;
let composerPrompt = "";
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
  document.getElementById(SELECTED_ID)?.remove();
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("keydown", onKey, true);
  phase = "idle";
  cycleIndex = 0;
  pendingElements = [];
  activePendingIndex = 0;
  composerPrompt = "";
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
    highlight(el);
    updatePendingUI();
    return;
  }
  highlight(el);
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
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      color:#e4e4e7;
    }
    .grip-picker-hint{
      font-size:10px;
      color:#71717a;
      white-space:nowrap;
    }
    .grip-context-field{
      margin-bottom:8px;
    }
    .grip-context-composer{
      min-height:40px;
      max-height:160px;
      overflow-y:auto;
      border-radius:12px;
      background:#09090b;
      padding:8px 10px;
      cursor:text;
      line-height:1.45;
    }
    .grip-context-inline{
      line-height:1.45;
      word-break:break-word;
    }
    .grip-context-badges{
      display:inline;
    }
    .grip-context-badges:empty{
      display:none;
    }
    .grip-pending-chip{
      display:inline-flex;
      align-items:center;
      gap:3px;
      vertical-align:baseline;
      margin:0 4px 2px 0;
      border:none;
      border-radius:9999px;
      padding:1px 4px 1px 8px;
      font-size:10px;
      font-weight:500;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      text-transform:lowercase;
      line-height:1.35;
      background:transparent;
      color:#a1a1aa;
      cursor:pointer;
    }
    .grip-pending-chip-active{color:#fafafa}
    .grip-pending-remove{
      border:none;
      background:transparent;
      color:#71717a;
      font-size:11px;
      line-height:1;
      padding:0 2px;
      cursor:pointer;
    }
    .grip-pending-remove:hover{color:#fafafa}
    .grip-input-grow{
      display:inline-grid;
      vertical-align:baseline;
      min-width:72px;
      max-width:100%;
      margin:0 0 2px 0;
    }
    .grip-input-grow::after{
      content:attr(data-value);
      white-space:pre-wrap;
      visibility:hidden;
      grid-area:1/1;
      font:12px/1.45 system-ui,sans-serif;
      padding:1px 0;
      min-height:1.35em;
    }
    .grip-input-grow textarea.grip-context-input{
      grid-area:1/1;
      width:100%;
      min-width:72px;
      min-height:1.35em;
      max-height:96px;
      overflow:hidden;
      resize:none;
      border:none;
      border-radius:0;
      background:transparent;
      color:#fafafa;
      padding:1px 0;
      margin:0;
      font:12px/1.45 system-ui,sans-serif;
      outline:none;
      vertical-align:baseline;
      field-sizing:content;
    }
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
    #__grip_comment_cancel__{background:#27272a;color:#d4d4d8}
    #__grip_comment_save__{background:#2563eb;color:#fff}
    #${SELECTED_ID}{pointer-events:none!important}
    #${SELECTED_ID} .grip-selected{
      position:fixed;
      z-index:2147483645;
      box-sizing:border-box;
      border:1px dashed rgba(59,130,246,0.45);
      border-radius:0;
      background:rgba(59,130,246,0.04);
      pointer-events:none;
    }
    #${SELECTED_ID} .grip-selected-active{
      position:fixed;
      z-index:2147483646;
      box-sizing:border-box;
      border:1px dashed rgba(59,130,246,0.45);
      border-radius:0;
      background:rgba(59,130,246,0.04);
      pointer-events:none;
    }
    #${HOVER_ID}{
      position:fixed;
      z-index:2147483646;
      box-sizing:border-box;
      border:1px dashed #3b82f6;
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
    const cycle = stackSize > 1 ? ` [${cycleIndex + 1}:${stackSize}]` : "";
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

function setupPanelDrag(panel: HTMLElement): void {
  const header = panel.querySelector(".grip-picker-header") as HTMLElement | null;
  if (!header || header.dataset.dragBound === "1") return;
  header.dataset.dragBound = "1";

  header.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = panel.getBoundingClientRect();
    panelDrag = {
      startX: e.clientX,
      startY: e.clientY,
      originLeft: rect.left,
      originTop: rect.top,
    };
    panelManuallyPlaced = true;
    header.classList.add("grip-picker-dragging");

    const onDrag = (ev: MouseEvent) => {
      if (!panelDrag) return;
      const dx = ev.clientX - panelDrag.startX;
      const dy = ev.clientY - panelDrag.startY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      panel.style.left = `${clamp(panelDrag.originLeft + dx, VIEWPORT_PAD, vw - VIEWPORT_PAD - w)}px`;
      panel.style.top = `${clamp(panelDrag.originTop + dy, VIEWPORT_PAD, vh - VIEWPORT_PAD - h)}px`;
    };

    const onDragEnd = () => {
      panelDrag = null;
      header.classList.remove("grip-picker-dragging");
      document.removeEventListener("mousemove", onDrag, true);
      document.removeEventListener("mouseup", onDragEnd, true);
    };

    document.addEventListener("mousemove", onDrag, true);
    document.addEventListener("mouseup", onDragEnd, true);
  });
}

function toPending(el: Element): PendingPick {
  const desc = describeElement(el);
  return {
    el,
    css: desc.css,
    tag: desc.tagName.toLowerCase(),
    role: desc.role?.toLowerCase() ?? "",
  };
}

function ensureSelectedLayer(): HTMLElement {
  let layer = document.getElementById(SELECTED_ID);
  if (!layer) {
    layer = document.createElement("div");
    layer.id = SELECTED_ID;
    document.documentElement.appendChild(layer);
  }
  return layer;
}

function getComposerInput(): HTMLTextAreaElement | null {
  return document.getElementById("__grip_comment_input__") as HTMLTextAreaElement | null;
}

function chipHtml(index: number, tag: string, active: boolean): string {
  return `<button type="button" class="grip-pending-chip${active ? " grip-pending-chip-active" : ""}" data-index="${index}">
    <span>${escapeHtml(tag)}</span>
    <span class="grip-pending-remove" data-remove="${index}" aria-label="Remove">×</span>
  </button>`;
}

function renderPendingBadges(): void {
  const badges = document.getElementById("__grip_comment_badges__");
  if (!badges) return;

  const chips = badges.querySelectorAll<HTMLElement>("[data-index]");

  if (chips.length === pendingElements.length) {
    chips.forEach((chip, index) => {
      const item = pendingElements[index];
      if (!item) return;
      chip.className = `grip-pending-chip${index === activePendingIndex ? " grip-pending-chip-active" : ""}`;
      chip.dataset.index = String(index);
      const label = chip.querySelector("span:first-child");
      if (label) label.textContent = item.tag;
      chip.querySelector<HTMLElement>("[data-remove]")?.setAttribute("data-remove", String(index));
    });
    return;
  }

  if (chips.length + 1 === pendingElements.length) {
    const index = pendingElements.length - 1;
    const item = pendingElements[index];
    if (item) {
      badges.insertAdjacentHTML(
        "beforeend",
        chipHtml(index, item.tag, index === activePendingIndex),
      );
    }
    chips.forEach((chip, index) => {
      chip.className = `grip-pending-chip${index === activePendingIndex ? " grip-pending-chip-active" : ""}`;
    });
    return;
  }

  badges.innerHTML = pendingElements
    .map((item, index) => chipHtml(index, item.tag, index === activePendingIndex))
    .join("");
}

function withComposerState(fn: () => void): void {
  const input = getComposerInput();
  const snapshot = input
    ? {
        value: input.value,
        start: input.selectionStart,
        end: input.selectionEnd,
        focused: document.activeElement === input,
      }
    : null;

  fn();

  if (!input || !snapshot) return;
  input.value = snapshot.value;
  composerPrompt = snapshot.value;
  if (snapshot.focused) {
    input.focus({ preventScroll: true });
    const start = Math.min(snapshot.start, input.value.length);
    const end = Math.min(snapshot.end, input.value.length);
    input.setSelectionRange(start, end);
  }
  syncComposerInput(input);
}

function updatePendingHighlights(): void {
  ensureStyle();
  const layer = ensureSelectedLayer();
  layer.innerHTML = "";

  const min = 3;
  pendingElements.forEach((item, index) => {
    const r = item.el.getBoundingClientRect();
    const box = document.createElement("div");
    box.className = index === activePendingIndex ? "grip-selected-active" : "grip-selected";
    box.style.top = `${r.top}px`;
    box.style.left = `${r.left}px`;
    box.style.width = `${Math.max(r.width, min)}px`;
    box.style.height = `${Math.max(r.height, min)}px`;
    layer.appendChild(box);
  });
}

function updatePendingUI(): void {
  withComposerState(() => {
    renderPendingBadges();
    const sessionLabel = document.getElementById("__grip_session_label__");
    if (sessionLabel) {
      sessionLabel.textContent = formatPickerIndexLabel();
    }
    updateComposerPlaceholder();
    updatePendingHighlights();
  });
}

function formatPickerIndexLabel(): string {
  if (stackSize > 1) {
    return `[${cycleIndex + 1}:${stackSize}]`;
  }
  const count = Math.max(pendingElements.length, 1);
  return `[${activePendingIndex + 1}:${count}]`;
}

function updateComposerPlaceholder(): void {
  const input = document.getElementById("__grip_comment_input__") as HTMLTextAreaElement | null;
  if (!input) return;
  input.placeholder =
    pendingElements.length > 0
      ? ""
      : "Select elements on the page, then describe what you need…";
}

function removePendingAt(index: number): void {
  if (index < 0 || index >= pendingElements.length) return;
  pendingElements.splice(index, 1);
  if (!pendingElements.length) {
    resumeHover();
    return;
  }
  activePendingIndex = Math.min(activePendingIndex, pendingElements.length - 1);
  highlight(pendingElements[activePendingIndex]?.el);
  updatePendingUI();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function handleComposerBackspace(input: HTMLTextAreaElement): boolean {
  if (!pendingElements.length) return false;
  if (input.value.length > 0) return false;

  const index =
    activePendingIndex >= 0 && activePendingIndex < pendingElements.length
      ? activePendingIndex
      : pendingElements.length - 1;
  removePendingAt(index);
  if (phase === "comment" && pendingElements.length > 0) {
    focusComposerInput();
  }
  return true;
}

function syncComposerInput(input?: HTMLTextAreaElement | null): void {
  const el = input ?? getComposerInput();
  const grow = document.getElementById("__grip_input_grow__");
  if (!el || !grow) return;

  composerPrompt = el.value;
  const mirror = el.value.length > 0 ? el.value : el.placeholder;
  grow.setAttribute("data-value", mirror);

  const start = el.selectionStart;
  const end = el.selectionEnd;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  if (document.activeElement === el) {
    el.setSelectionRange(start, end);
  }
}

function addToPending(el: Element, options?: { keepTyping?: boolean }): void {
  const next = toPending(el);
  const existingIndex = pendingElements.findIndex((item) => item.css === next.css);
  if (existingIndex >= 0) {
    activePendingIndex = existingIndex;
  } else {
    pendingElements.push(next);
    activePendingIndex = pendingElements.length - 1;
  }

  highlight(el);
  updatePendingUI();

  const panel = document.getElementById(COMMENT_ID);
  if (panel && !panelManuallyPlaced && !options?.keepTyping) {
    positionCommentPanel(panel, el);
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
    <div class="grip-picker-header" title="Drag to move">
      <span id="__grip_session_label__" class="grip-picker-session">[1:1]</span>
      <span class="grip-picker-hint">type · click add · drag</span>
    </div>
    <div class="grip-context-field">
      <div id="__grip_comment_composer__" class="grip-context-composer">
        <div class="grip-context-inline">
          <div id="__grip_comment_badges__" class="grip-context-badges"></div><span class="grip-input-grow" id="__grip_input_grow__" data-value=""><textarea id="__grip_comment_input__" class="grip-context-input" placeholder="Select elements on the page, then describe what you need…" rows="1"></textarea></span>
        </div>
      </div>
    </div>
    <div class="grip-picker-actions">
      <button type="button" id="__grip_comment_cancel__">Cancel</button>
      <button type="button" id="__grip_comment_save__">Save</button>
    </div>
  `;
  document.documentElement.appendChild(panel);
  setupPanelDrag(panel);
  return panel;
}

function bindBadgeEvents(panel: HTMLElement): void {
  const composer = panel.querySelector("#__grip_comment_composer__");
  if (!composer || composer.getAttribute("data-bound") === "1") return;
  composer.setAttribute("data-bound", "1");

  composer.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-index], [data-remove]")) {
      e.preventDefault();
      return;
    }
    if (!target.closest("#__grip_comment_input__")) {
      focusComposerInput();
    }
  });

  composer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const removeBtn = target.closest<HTMLElement>("[data-remove]");
    if (removeBtn) {
      e.stopPropagation();
      const index = Number(removeBtn.dataset.remove);
      if (!Number.isNaN(index)) removePendingAt(index);
      return;
    }
    const chip = target.closest<HTMLElement>("[data-index]");
    if (!chip) return;
    const index = Number(chip.dataset.index);
    if (Number.isNaN(index) || !pendingElements[index]) return;
    activePendingIndex = index;
    highlight(pendingElements[index].el);
    updatePendingUI();
  });
}

function focusComposerInput(): void {
  getComposerInput()?.focus({ preventScroll: true });
}

function resumeHover(): void {
  document.getElementById(COMMENT_ID)?.remove();
  document.getElementById(HINT_ID)?.remove();
  document.getElementById(SELECTED_ID)?.remove();
  pendingElements = [];
  activePendingIndex = 0;
  composerPrompt = "";
  panelManuallyPlaced = false;
  panelDrag = null;
  phase = "hover";
  updateHover(lastX, lastY);
}

function finishPick(comment: string, continueSession: boolean): void {
  if (!pendingElements.length) return;
  const trimmed = (comment || composerPrompt).trim();
  for (const item of pendingElements) {
    sendPick(item.el, trimmed);
  }
  safeSendMessage({ type: "SHOW_TRAY" });
  sessionPickCount += pendingElements.length;
  pendingElements = [];
  activePendingIndex = 0;
  composerPrompt = "";

  if (continueSession) {
    resumeHover();
    return;
  }
  cleanup();
}

function showCommentPrompt(el: Element): void {
  const panel = document.getElementById(COMMENT_ID) ?? ensureCommentPanel();
  const isNewPanel = phase !== "comment";

  if (isNewPanel) {
    panelManuallyPlaced = false;
    panelDrag = null;
    phase = "comment";
    document.getElementById(HINT_ID)?.remove();
  }

  const input = panel.querySelector("#__grip_comment_input__") as HTMLTextAreaElement;
  const composer = panel.querySelector("#__grip_comment_composer__") as HTMLElement | null;
  const save = panel.querySelector("#__grip_comment_save__") as HTMLButtonElement;
  const cancel = panel.querySelector("#__grip_comment_cancel__") as HTMLButtonElement;

  if (isNewPanel) {
    pendingElements = [];
    activePendingIndex = 0;
    composerPrompt = "";
    input.value = "";
  }

  addToPending(el);
  panel.style.display = "block";

  if (save.dataset.bound !== "1") {
    save.dataset.bound = "1";
    bindBadgeEvents(panel);
    save.onclick = (e) => {
      e.stopPropagation();
      finishPick(input.value, true);
    };
    cancel.onclick = (e) => {
      e.stopPropagation();
      cleanup();
    };
    input.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === "Backspace" && handleComposerBackspace(e.target as HTMLTextAreaElement)) {
        e.preventDefault();
        return;
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        finishPick(input.value, true);
      }
      if (e.key === "Escape") resumeHover();
    };
    input.addEventListener("input", () => {
      composerPrompt = input.value;
      syncComposerInput(input);
    });

    panel.addEventListener("mousedown", (e) => e.stopPropagation());
    panel.addEventListener("click", (e) => e.stopPropagation());
  }

  if (!panelManuallyPlaced) {
    positionCommentPanel(panel, el, true);
  }

  if (isNewPanel) {
    const reposition = () => {
      const active = pendingElements[activePendingIndex]?.el;
      if (phase === "comment" && active && !panelManuallyPlaced) {
        highlight(active);
        updatePendingHighlights();
        positionCommentPanel(panel, active);
      }
    };
    window.addEventListener("resize", reposition, { once: true });
    window.addEventListener("scroll", reposition, { once: true, capture: true });
  }

  if (isNewPanel) {
    focusComposerInput();
  }
  syncComposerInput(input);
}

function onClick(e: MouseEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if (phase !== "hover" && phase !== "comment") return;
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
    if (phase === "hover") cleanup();
    return;
  }

  if (phase === "comment") {
    const input = getComposerInput();
    const keepTyping = document.activeElement === input;
    addToPending(el, { keepTyping });
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
