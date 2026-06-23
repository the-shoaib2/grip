import {
  composerStateForStoredPick,
  deepElementFromPoint,
  describeElement,
  elementFromComposedEvent,
  elementsAtPoint,
  formatInlineCommentForMcp,
  newChipId,
  type OpenContextEditorPayload,
  type StoredPickChipRef,
} from "@grip/core";
import type { PickerStartPayload } from "@grip/core";
import {
  bindChipTooltipRoot,
  bindEditorClipboard,
  chipMetaFromElement,
  findChipElement,
  focusEditor,
  handleEditorKeydown,
  insertChipAtSelection,
  isExtensionContextValid,
  placeCaretAtEnd,
  removeChipElement,
  safeSendMessage,
  selectChipElement,
  serializeEditor,
  setEditorFromComment,
  toInlineChipRef,
  updateChipActiveStates,
  type InlineChipRef,
} from "@/lib";
import { showFloatingTray } from "@/content_scripts/tray-control";

const TRAY_ID = "__grip_tray__";
const HOVER_ID = "__grip_picker_hover__";
const STYLE_ID = "__grip_picker_style__";
const COMMENT_ID = "__grip_picker_comment__";
const HINT_ID = "__grip_picker_hint__";
const SELECTED_ID = "__grip_picker_selected__";

const VIEWPORT_PAD = 8;
const PANEL_GAP = 8;

type PickerPhase = "idle" | "hover" | "comment" | "edit";

interface PendingPick {
  chipId: string;
  el: Element;
  css: string;
  tag: string;
  role: string;
  text: string;
  name: string;
  xpath: string;
  rect: { top: number; left: number; width: number; height: number };
  shadowDOM: boolean;
  iframe: string;
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
let editingPickId: string | null = null;

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
  editingPickId = null;
  void chrome.storage.session.set({ pickerActive: false });
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
  if (phase === "comment" || phase === "edit") {
    highlight(el);
    updatePendingUI();
    return;
  }
  highlight(el);
}

function isEventInComposer(e: KeyboardEvent): boolean {
  const editor = document.getElementById("__grip_comment_editor__");
  if (!editor) return false;
  return e.composedPath().some(
    (node) => node === editor || (node instanceof Node && editor.contains(node)),
  );
}

function onKey(e: KeyboardEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }

  if (e.key === "Escape") {
    if (phase === "edit") {
      if (isEventInComposer(e)) return;
      e.preventDefault();
      closeContextEditor();
      return;
    }
    if (phase === "comment") {
      if (isEventInComposer(e)) return;
      e.preventDefault();
      resumeHover();
      return;
    }
    cleanup();
    return;
  }

  if ((phase === "comment" || phase === "edit") && isEventInComposer(e)) return;

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
    .grip-inline-editor{
      min-height:1.35em;
      max-height:96px;
      overflow-y:auto;
      outline:none;
      white-space:pre-wrap;
      word-break:break-word;
      font:12px/1.45 system-ui,sans-serif;
      color:#fafafa;
      caret-color:#fafafa;
      user-select:text;
      -webkit-user-select:text;
    }
    .grip-inline-editor:empty::before{
      content:attr(data-placeholder);
      color:#71717a;
      pointer-events:none;
    }
    .grip-inline-chip{
      display:inline-flex;
      align-items:center;
      vertical-align:baseline;
      margin:0 2px;
      padding:1px 8px;
      border-radius:9999px;
      border:none;
      background:#2d3748;
      color:#cbd5e1;
      font-size:10px;
      font-weight:500;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      line-height:1.35;
      user-select:all;
      cursor:default;
      white-space:nowrap;
    }
    .grip-inline-chip-active{
      background:rgba(37,99,235,0.22);
      color:#f8fafc;
    }
    .grip-chip-tooltip{
      position:fixed;
      z-index:2147483647;
      pointer-events:none;
      max-width:min(240px,calc(100vw - 16px));
      padding:8px 10px;
      border-radius:10px;
      background:#18181b;
      border:1px solid #3f3f46;
      box-shadow:0 8px 24px rgba(0,0,0,.38);
      font:11px/1.35 system-ui,sans-serif;
      color:#fafafa;
    }
    .grip-chip-tooltip-head{
      display:flex;
      align-items:center;
      gap:6px;
      margin-bottom:2px;
    }
    .grip-chip-tooltip-tag{
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      font-size:10px;
      color:#93c5fd;
    }
    .grip-chip-tooltip-role{
      font-size:9px;
      color:#a1a1aa;
      padding:1px 6px;
      border-radius:9999px;
      background:#27272a;
    }
    .grip-chip-tooltip-text{
      margin:2px 0 0;
      color:#d4d4d8;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .grip-chip-tooltip-css{
      margin:4px 0 0;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      font-size:9px;
      color:#71717a;
      overflow-wrap:anywhere;
      word-break:break-all;
    }
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
  if (phase !== "hover" && phase !== "comment" && phase !== "edit") return;
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
    chipId: newChipId(),
    el,
    css: desc.css,
    tag: desc.tagName.toLowerCase(),
    role: desc.role?.toLowerCase() ?? "",
    text: desc.innerText,
    name: desc.name,
    xpath: desc.xpath,
    rect: desc.rect,
    shadowDOM: desc.shadowDOM,
    iframe: desc.iframe,
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

function getComposerEditor(): HTMLElement | null {
  return document.getElementById("__grip_comment_editor__");
}

const COMPOSER_PLACEHOLDER =
  "Select elements on the page, then describe what you need…";

function withComposerState(fn: () => void): void {
  const editor = getComposerEditor();
  const sel = window.getSelection();
  const range =
    sel?.rangeCount && editor?.contains(sel.anchorNode)
      ? sel.getRangeAt(0).cloneRange()
      : null;
  const focused = document.activeElement === editor;
  const snapshot = editor ? serializeEditor(editor) : composerPrompt;

  fn();

  if (!editor) return;
  composerPrompt = serializeEditor(editor) || snapshot;
  if (range && focused) {
    try {
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      placeCaretAtEnd(editor);
    }
  }
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
    const editor = getComposerEditor();
    if (editor) {
      updateChipActiveStates(
        editor,
        pendingElements[activePendingIndex]?.chipId,
      );
    }
    const sessionLabel = document.getElementById("__grip_session_label__");
    if (sessionLabel) {
      sessionLabel.textContent = formatPickerIndexLabel();
    }
    updateComposerPlaceholder();
    updatePendingHighlights();
  });
}

function formatPickerIndexLabel(): string {
  if (phase === "hover" && stackSize > 1) {
    return `[${cycleIndex + 1}:${stackSize}]`;
  }
  const count = Math.max(pendingElements.length, 1);
  return `[${activePendingIndex + 1}:${count}]`;
}

function inlineChipsFromStored(chips: StoredPickChipRef[]): InlineChipRef[] {
  return chips.map((chip) => ({
    id: chip.id,
    tag: chip.tag,
    role: chip.role,
    css: chip.css,
    xpath: chip.xpath,
    text: chip.text,
    name: chip.name,
    rect: chip.rect,
    shadowDOM: chip.shadowDOM,
    iframe: chip.iframe,
  }));
}

function syncPendingFromStoredChips(chips: StoredPickChipRef[]): Element | null {
  pendingElements = [];
  let anchor: Element | null = null;
  for (const chip of chips) {
    if (!chip.css) continue;
    const el = document.querySelector(chip.css);
    if (!el) continue;
    const existing = pendingElements.find((item) => item.css === chip.css);
    if (existing) {
      existing.chipId = chip.id;
      continue;
    }
    const pending = toPending(el);
    pending.chipId = chip.id;
    pendingElements.push(pending);
    anchor ??= el;
  }
  activePendingIndex = 0;
  if (pendingElements[0]) {
    highlight(pendingElements[0].el);
    anchor = pendingElements[0].el;
  }
  return anchor;
}

function updateComposerPlaceholder(): void {
  const editor = getComposerEditor();
  if (!editor) return;
  editor.dataset.placeholder =
    pendingElements.length > 0 ? "" : COMPOSER_PLACEHOLDER;
}

function removePendingByChipId(chipId: string): void {
  const index = pendingElements.findIndex((item) => item.chipId === chipId);
  if (index >= 0) removePendingAt(index);
}

function removePendingAt(index: number): void {
  if (index < 0 || index >= pendingElements.length) return;
  const item = pendingElements[index];
  if (!item) return;

  const editor = getComposerEditor();
  const chip = editor ? findChipElement(editor, item.chipId) : null;
  if (chip) removeChipElement(chip);

  pendingElements.splice(index, 1);
  if (!pendingElements.length) {
    if (phase === "edit") {
      closeContextEditor();
      return;
    }
    resumeHover();
    return;
  }
  activePendingIndex = Math.min(activePendingIndex, pendingElements.length - 1);
  highlight(pendingElements[activePendingIndex]?.el);
  updatePendingUI();
}

function syncComposerEditor(editor?: HTMLElement | null): void {
  const el = editor ?? getComposerEditor();
  if (!el) return;
  composerPrompt = serializeEditor(el);
}

function addToPending(el: Element, options?: { keepTyping?: boolean }): void {
  const next = toPending(el);
  const existingIndex = pendingElements.findIndex((item) => item.css === next.css);
  const editor = getComposerEditor();
  let inserted = false;

  if (existingIndex >= 0) {
    activePendingIndex = existingIndex;
    next.chipId = pendingElements[existingIndex]!.chipId;
  } else {
    pendingElements.push(next);
    activePendingIndex = pendingElements.length - 1;
    if (editor) {
      insertChipAtSelection(editor, toInlineChipRef(next), true);
      inserted = true;
      composerPrompt = serializeEditor(editor);
    }
  }

  highlight(el);
  updatePendingUI();

  const panel = document.getElementById(COMMENT_ID);
  if (panel && !panelManuallyPlaced && !options?.keepTyping) {
    positionCommentPanel(panel, el);
  }

  if (editor && !options?.keepTyping && inserted) {
    focusEditor(editor);
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
        <div
          id="__grip_comment_editor__"
          class="grip-inline-editor"
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
          data-placeholder="${COMPOSER_PLACEHOLDER}"
        ></div>
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

function bindComposerEvents(panel: HTMLElement): void {
  const composer = panel.querySelector("#__grip_comment_composer__");
  const editor = getComposerEditor();
  if (!composer || !editor || composer.getAttribute("data-bound") === "1") return;
  composer.setAttribute("data-bound", "1");

  composer.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    const chip = target.closest<HTMLElement>(".grip-inline-chip");
    if (chip) {
      e.preventDefault();
      selectChipElement(chip);
      return;
    }
    if (!editor.contains(target)) {
      focusComposerEditor();
      return;
    }
    const clickedInEditor = target !== editor;
    focusEditor(editor, { caret: clickedInEditor ? "preserve" : "end" });
  });

  composer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const chip = target.closest<HTMLElement>(".grip-inline-chip");
    if (!chip) return;
    const chipId = chip.dataset.gripChip;
    const index = pendingElements.findIndex((item) => item.chipId === chipId);
    if (index < 0 || !pendingElements[index]) return;
    activePendingIndex = index;
    highlight(pendingElements[index].el);
    updatePendingUI();
  });

  editor.addEventListener("input", () => {
    syncComposerEditor(editor);
  });

  bindEditorClipboard(editor);

  editor.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (
      handleEditorKeydown(editor, e, (chipId) => {
        removePendingByChipId(chipId);
        syncComposerEditor(editor);
      })
    ) {
      return;
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (phase === "edit") {
        finishEdit(serializeEditor(editor));
        return;
      }
      finishPick(serializeEditor(editor), true);
    }
    if (e.key === "Escape") {
      if (phase === "edit") {
        closeContextEditor();
        return;
      }
      resumeHover();
    }
  });

  bindChipTooltipRoot(editor, (chip) => {
    const meta = chipMetaFromElement(chip);
    if (meta) return meta;
    const pick = pendingElements.find((item) => item.chipId === chip.dataset.gripChip);
    if (!pick) return null;
    return {
      tag: pick.tag,
      role: pick.role,
      css: pick.css,
      text: pick.text,
      name: pick.name,
    };
  });
}

function focusComposerEditor(): void {
  const editor = getComposerEditor();
  if (!editor) return;
  requestAnimationFrame(() => {
    focusEditor(editor, { caret: "end" });
  });
}

function restoreShellAfterEdit(): void {
  void chrome.storage.session.set({ pickerActive: false });
  showFloatingTray();
  safeSendMessage({ type: "SHOW_TRAY" });
}

function closeContextEditor(): void {
  if (phase !== "edit") return;
  editingPickId = null;
  document.getElementById(COMMENT_ID)?.remove();
  document.getElementById(SELECTED_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("keydown", onKey, true);
  pendingElements = [];
  activePendingIndex = 0;
  composerPrompt = "";
  panelManuallyPlaced = false;
  panelDrag = null;
  phase = "idle";
  restoreShellAfterEdit();
}

function finishEdit(comment: string): void {
  if (!editingPickId) return;
  const tagsById = Object.fromEntries(
    pendingElements.map((item) => [item.chipId, item.tag]),
  );
  const trimmed = formatInlineCommentForMcp(
    (comment || composerPrompt).trim(),
    tagsById,
  );
  safeSendMessage({
    type: "UPDATE_PICK_COMMENT",
    payload: { pickId: editingPickId, comment: trimmed || undefined },
  });
  closeContextEditor();
}

function commitPanelSave(): void {
  const editor = getComposerEditor();
  const value = editor ? serializeEditor(editor) : "";
  if (phase === "edit") {
    finishEdit(value);
    return;
  }
  finishPick(value, true);
}

function commitPanelCancel(): void {
  if (phase === "edit") {
    closeContextEditor();
    return;
  }
  if (phase === "comment") {
    resumeHover();
    return;
  }
  cleanup();
}

function bindPanelActions(panel: HTMLElement, _editor: HTMLElement): void {
  bindComposerEvents(panel);

  if (panel.dataset.stopBound !== "1") {
    panel.dataset.stopBound = "1";
    panel.addEventListener("mousedown", (e) => e.stopPropagation());
    panel.addEventListener("click", (e) => e.stopPropagation());
  }

  const actions = panel.querySelector(".grip-picker-actions") as
    | (HTMLElement & { __gripActionsHandler?: (e: Event) => void })
    | null;
  if (!actions) return;

  if (actions.__gripActionsHandler) {
    actions.removeEventListener("click", actions.__gripActionsHandler, true);
  }

  const handler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.closest("#__grip_comment_save__")) {
      e.preventDefault();
      e.stopPropagation();
      commitPanelSave();
      return;
    }
    if (target.closest("#__grip_comment_cancel__")) {
      e.stopPropagation();
      commitPanelCancel();
    }
  };

  actions.__gripActionsHandler = handler;
  actions.addEventListener("click", handler, true);
}

function openContextEditor(payload: OpenContextEditorPayload): void {
  if (phase === "hover" || phase === "comment") cleanup();

  const { pick } = payload;
  editingPickId = pick.id;
  ensureStyle();
  const panel = ensureCommentPanel();
  panelManuallyPlaced = false;
  panelDrag = null;
  phase = "edit";
  pendingElements = [];
  activePendingIndex = 0;
  composerPrompt = "";

  const { chips, comment } = composerStateForStoredPick(pick);
  const editor = panel.querySelector("#__grip_comment_editor__") as HTMLElement;
  const inlineChips = inlineChipsFromStored(chips);
  setEditorFromComment(editor, comment, inlineChips, undefined, { caretAtEnd: true });
  const anchor = syncPendingFromStoredChips(chips);

  if (anchor) {
    positionCommentPanel(panel, anchor, true);
  } else {
    panel.style.display = "block";
    panel.style.visibility = "visible";
    panel.style.top = `${Math.max(VIEWPORT_PAD, window.innerHeight / 2 - 80)}px`;
    panel.style.left = `${Math.max(VIEWPORT_PAD, window.innerWidth / 2 - 160)}px`;
  }

  bindPanelActions(panel, editor);
  requestAnimationFrame(() => {
    panel.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
  updatePendingUI();
  focusComposerEditor();
  syncComposerEditor(editor);
}

function resumeHover(): void {
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
  const tagsById = Object.fromEntries(
    pendingElements.map((item) => [item.chipId, item.tag]),
  );
  const trimmed = formatInlineCommentForMcp(
    (comment || composerPrompt).trim(),
    tagsById,
  );
  for (const item of pendingElements) {
    sendPick(item.el, trimmed);
  }
  document.getElementById(COMMENT_ID)?.remove();
  showFloatingTray();
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

  const editor = panel.querySelector("#__grip_comment_editor__") as HTMLElement;

  if (isNewPanel) {
    pendingElements = [];
    activePendingIndex = 0;
    composerPrompt = "";
    setEditorFromComment(editor, "", []);
  }

  addToPending(el);
  panel.style.display = "block";

  bindPanelActions(panel, editor);

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
    focusComposerEditor();
  }
  syncComposerEditor(editor);
}

function onClick(e: MouseEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if (phase !== "hover" && phase !== "comment" && phase !== "edit") return;
  if (isGripChrome(e.target)) return;
  if (phase === "edit") return;

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
    const editor = getComposerEditor();
    const keepTyping = document.activeElement === editor;
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
  void chrome.storage.session.set({ pickerActive: true });
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
    showFloatingTray({ restore: true });
    safeSendMessage({ type: "SHOW_TRAY", payload: { restore: true } });
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "OPEN_CONTEXT_EDITOR") {
    openContextEditor(msg.payload as OpenContextEditorPayload);
    sendResponse({ ok: true });
    return true;
  }
});

/** Drop stale picker-active UI state when the content script reloads mid-session. */
void chrome.storage.session.get("pickerActive").then((data) => {
  if (data.pickerActive && phase === "idle") {
    void chrome.storage.session.set({ pickerActive: false });
  }
});
