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
  type PickerElementPayload,
} from "@grip/core";
import {
  bindChipTooltipRoot,
  bindEditorClipboard,
  chipMetaFromElement,
  findChipElement,
  focusEditor,
  handleEditorKeydown,
  insertChipAtSelection,
  isEditorEmpty,
  removeChipElement,
  selectChipElement,
  serializeEditor,
  setEditorFromComment,
  toInlineChipRef,
  updateChipActiveStates,
  type InlineChipRef,
} from "@grip/devtools";
import { showTrayAfterHandoff } from "./trayBridge";

const TRAY_ID = "__grip_tray__";
const HOVER_ID = "__grip_picker_hover__";
const STYLE_ID = "__grip_picker_style__";
const COMMENT_ID = "__grip_picker_comment__";
const HINT_ID = "__grip_picker_hint__";

const COMPOSER_PLACEHOLDER =
  "Select elements on the page, then describe what you need…";

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

export interface PlaygroundPickerOptions {
  onSave: (payload: PickerElementPayload) => void;
  onStop?: () => void;
}

let phase: PickerPhase = "idle";
let cycleIndex = 0;
let lastX = 0;
let lastY = 0;
let stackSize = 1;
let pendingElements: PendingPick[] = [];
let activePendingIndex = 0;
let onSaveCallback: ((payload: PickerElementPayload) => void) | null = null;
let onStopCallback: (() => void) | null = null;
let onEditSaveCallback: ((pickId: string, comment: string) => void) | null = null;
let onEditEndCallback: (() => void) | null = null;
let editingPickId: string | null = null;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
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

function isGripChrome(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return Boolean(
    el.closest(`#${TRAY_ID}, #${COMMENT_ID}, #${HOVER_ID}, #${HINT_ID}`),
  );
}

function getComposerEditor(): HTMLElement | null {
  return document.getElementById("__grip_comment_editor__");
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

function formatPickerIndexLabel(): string {
  if (phase === "hover" && stackSize > 1) return `[${cycleIndex + 1}:${stackSize}]`;
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

function updatePendingUI(): void {
  const editor = getComposerEditor();
  if (editor) {
    updateChipActiveStates(editor, pendingElements[activePendingIndex]?.chipId);
  }
  const sessionLabel = document.getElementById("__grip_session_label__");
  if (sessionLabel) sessionLabel.textContent = formatPickerIndexLabel();
  updateComposerPlaceholder();
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
  highlight(pendingElements[activePendingIndex]!.el);
  updatePendingUI();
}

function removePendingByChipId(chipId: string): void {
  const index = pendingElements.findIndex((item) => item.chipId === chipId);
  if (index >= 0) removePendingAt(index);
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
      position:fixed;
      z-index:2147483647;
    }
    .grip-picker-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      margin-bottom:8px;
    }
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
    .grip-context-field{margin-bottom:8px}
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
    #${HOVER_ID}{
      position:fixed;
      z-index:2147483646;
      box-sizing:border-box;
      border:1px dashed #3b82f6;
      border-radius:0;
      background:rgba(59,130,246,0.06);
      pointer-events:none;
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

function cycleSelection(dir: 1 | -1): void {
  if (stackSize <= 1) return;
  cycleIndex = (cycleIndex + dir + stackSize) % stackSize;
  const el = targetAt(lastX, lastY, cycleIndex);
  if (!el) return;
  highlight(el);
  if (phase === "comment" || phase === "edit") updatePendingUI();
}

function positionCommentPanel(panel: HTMLElement, el: Element): void {
  const anchor = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 8;
  const pad = 8;

  panel.style.display = "block";
  panel.style.visibility = "hidden";
  panel.style.left = "0";
  panel.style.top = "0";

  const panelRect = panel.getBoundingClientRect();
  const width = panelRect.width;
  const height = panelRect.height;

  let top = anchor.bottom + gap;
  if (top + height > vh - pad) top = anchor.top - height - gap;
  top = clamp(top, pad, vh - pad - height);

  let left = anchor.left;
  if (left + width > vw - pad) left = anchor.right - width;
  left = clamp(left, pad, vw - pad - width);

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  panel.style.visibility = "visible";
}

function centerCommentPanel(panel: HTMLElement): void {
  const pad = 8;
  panel.style.display = "block";
  panel.style.visibility = "hidden";
  panel.style.left = "0";
  panel.style.top = "0";

  const panelRect = panel.getBoundingClientRect();
  const top = clamp(
    window.innerHeight / 2 - panelRect.height / 2,
    pad,
    window.innerHeight - pad - panelRect.height,
  );
  const left = clamp(
    window.innerWidth / 2 - panelRect.width / 2,
    pad,
    window.innerWidth - pad - panelRect.width,
  );

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  panel.style.visibility = "visible";
}

function revealCommentPanel(panel: HTMLElement): void {
  requestAnimationFrame(() => {
    panel.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

function ensureCommentPanel(): HTMLElement {
  let panel = document.getElementById(COMMENT_ID);
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = COMMENT_ID;
  panel.className = "grip-picker-panel";
  panel.innerHTML = `
    <div class="grip-picker-header">
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
  return panel;
}

function bindPanelActions(panel: HTMLElement): void {
  const save = panel.querySelector("#__grip_comment_save__") as HTMLButtonElement;
  const cancel = panel.querySelector("#__grip_comment_cancel__") as HTMLButtonElement;
  if (!save || !cancel) return;

  if (save.dataset.bound !== "1") {
    save.dataset.bound = "1";
    bindComposerEvents(panel);
    panel.addEventListener("mousedown", (e) => e.stopPropagation());
    panel.addEventListener("click", (e) => e.stopPropagation());
  }

  const handleSave = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    const editor = getComposerEditor();
    const value = editor ? serializeEditor(editor) : "";
    if (phase === "edit") {
      finishEdit(value);
      return;
    }
    finishPick(value, true);
  };

  const handleCancel = (e: Event) => {
    e.stopPropagation();
    if (phase === "edit") {
      closeContextEditor();
      return;
    }
    stopPlaygroundPicker();
  };

  if (save.dataset.bound !== "1") {
    save.dataset.bound = "1";
    bindComposerEvents(panel);
    panel.addEventListener("mousedown", (e) => e.stopPropagation());
    panel.addEventListener("click", (e) => e.stopPropagation());
    save.addEventListener("click", handleSave, true);
    cancel.addEventListener("click", handleCancel, true);
  }

  save.onclick = handleSave;
  cancel.onclick = handleCancel;
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
    highlight(pendingElements[index]!.el);
    updatePendingUI();
  });

  bindEditorClipboard(editor);

  editor.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (
      handleEditorKeydown(editor, e, (chipId) => {
        removePendingByChipId(chipId);
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
    }
  }

  highlight(el);
  updatePendingUI();

  const panel = document.getElementById(COMMENT_ID);
  if (panel && !options?.keepTyping) {
    positionCommentPanel(panel, el);
  }

  if (editor && !options?.keepTyping && inserted) {
    focusComposerEditor();
  }
}

function finishPick(comment: string, continueSession: boolean): void {
  if (!pendingElements.length || !onSaveCallback) return;
  const tagsById = Object.fromEntries(
    pendingElements.map((item) => [item.chipId, item.tag]),
  );
  const trimmed = formatInlineCommentForMcp(comment.trim(), tagsById);

  for (const item of pendingElements) {
    onSaveCallback({
      ...describeElement(item.el),
      comment: trimmed || undefined,
    });
  }

  pendingElements = [];
  activePendingIndex = 0;

  document.getElementById(COMMENT_ID)?.remove();
  showTrayAfterHandoff(false);

  if (continueSession) {
    resumeHover();
    return;
  }
  stopPlaygroundPicker();
}

function resumeHover(): void {
  document.getElementById(HINT_ID)?.remove();
  pendingElements = [];
  activePendingIndex = 0;
  phase = "hover";
  updateHover(lastX, lastY);
}

function showCommentPrompt(el: Element): void {
  const panel = ensureCommentPanel();
  phase = "comment";
  addToPending(el);
  bindPanelActions(panel);
  positionCommentPanel(panel, el);
  revealCommentPanel(panel);
  focusComposerEditor();
}

function isEventInComposer(e: KeyboardEvent): boolean {
  const editor = getComposerEditor();
  if (!editor) return false;
  return e.composedPath().some(
    (node) => node === editor || (node instanceof Node && editor.contains(node)),
  );
}

function onMove(e: MouseEvent): void {
  if (phase !== "hover" && phase !== "comment" && phase !== "edit") return;
  if (isGripChrome(e.target)) return;
  updateHover(e.clientX, e.clientY);
}

function onClick(e: MouseEvent): void {
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
    if (phase === "hover") stopPlaygroundPicker();
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

function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    if (phase === "edit") {
      if (isEventInComposer(e)) return;
      e.preventDefault();
      closeContextEditor();
      return;
    }
    if (phase === "comment" && isEventInComposer(e)) {
      resumeHover();
      return;
    }
    stopPlaygroundPicker();
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

function closeContextEditor(): void {
  if (phase !== "edit") return;
  editingPickId = null;
  onEditSaveCallback = null;
  onEditEndCallback?.();
  onEditEndCallback = null;
  document.getElementById(COMMENT_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("keydown", onKey, true);
  pendingElements = [];
  activePendingIndex = 0;
  phase = "idle";
  showTrayAfterHandoff(false);
}

function finishEdit(comment: string): void {
  if (!editingPickId || !onEditSaveCallback) return;
  const tagsById = Object.fromEntries(
    pendingElements.map((item) => [item.chipId, item.tag]),
  );
  const trimmed = formatInlineCommentForMcp(comment.trim(), tagsById);
  onEditSaveCallback(editingPickId, trimmed);
  closeContextEditor();
}

export function openPlaygroundContextEditor(
  payload: OpenContextEditorPayload,
  onSave: (pickId: string, comment: string) => void,
  onEnd?: () => void,
): void {
  if (phase === "hover" || phase === "comment") stopPlaygroundPicker(false);

  const { pick } = payload;
  editingPickId = pick.id;
  onEditSaveCallback = onSave;
  onEditEndCallback = onEnd ?? null;
  ensureStyle();
  const panel = ensureCommentPanel();
  phase = "edit";
  activePendingIndex = 0;

  const { chips, comment } = composerStateForStoredPick(pick);
  const editor = panel.querySelector("#__grip_comment_editor__") as HTMLElement;
  const inlineChips = inlineChipsFromStored(chips);
  setEditorFromComment(editor, comment, inlineChips, undefined, { caretAtEnd: true });
  const anchor = syncPendingFromStoredChips(chips);

  if (anchor) {
    positionCommentPanel(panel, anchor);
  } else {
    centerCommentPanel(panel);
  }

  bindPanelActions(panel);
  revealCommentPanel(panel);

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
  updatePendingUI();
  focusComposerEditor();
}

export function stopPlaygroundPicker(notify = true): void {
  document.getElementById(HOVER_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
  document.getElementById(COMMENT_ID)?.remove();
  document.getElementById(HINT_ID)?.remove();
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("keydown", onKey, true);
  phase = "idle";
  cycleIndex = 0;
  pendingElements = [];
  activePendingIndex = 0;
  editingPickId = null;
  onEditSaveCallback = null;
  onEditEndCallback = null;
  onSaveCallback = null;
  if (notify) {
    onStopCallback?.();
    onStopCallback = null;
    showTrayAfterHandoff(true);
  }
}

export function startPlaygroundPicker(options: PlaygroundPickerOptions): void {
  stopPlaygroundPicker(false);
  onSaveCallback = options.onSave;
  onStopCallback = options.onStop ?? null;
  phase = "hover";
  cycleIndex = 0;
  ensureStyle();
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
}

export function isPlaygroundPickerActive(): boolean {
  return phase !== "idle";
}
