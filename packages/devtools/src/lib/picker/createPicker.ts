import {
  composerStateForStoredPick,
  deepElementFromPoint,
  elementFromComposedEvent,
  elementsAtPoint,
  formatInlineCommentForMcp,
  storedPickChipsToInlineRefs,
  type OpenContextEditorPayload,
} from "@grip/core";
import {
  bindChipTooltipRoot,
} from "../chipTooltip";
import {
  bindEditorClipboard,
  chipMetaFromElement,
  findChipElement,
  focusEditor,
  handleEditorKeydown,
  insertChipAtSelection,
  placeCaretAtEnd,
  removeChipElement,
  selectChipElement,
  serializeEditor,
  setEditorFromComment,
  toInlineChipRef,
  updateChipActiveStates,
} from "../inlineComposerDom";
import { syncPendingFromStoredChips, toPendingPick } from "./chipSync";
import {
  CONTEXT_CANCEL_ID,
  CONTEXT_COMPOSER_ID,
  CONTEXT_EDITOR_ID,
  CONTEXT_PANEL_ID,
  CONTEXT_SAVE_ID,
  COMPOSER_PLACEHOLDER,
  HINT_ID,
  HOVER_ID,
  PANEL_GAP,
  SELECTED_ID,
  SESSION_LABEL_ID,
  STYLE_ID,
  TRAY_ID,
  VIEWPORT_PAD,
} from "./constants";
import { buildPickerStyleSheet } from "./pickerStyles";
import { syncAllPickerThemeElements, syncPickerColorScheme } from "./pickerTheme";
import type {
  OpenContextEditorOptions,
  PendingPick,
  Picker,
  PickerFeatures,
  PickerHost,
  PickerPhase,
  PickerStopOptions,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function createPicker(host: PickerHost, features: PickerFeatures): Picker {
  let phase: PickerPhase = "idle";
  let cycleIndex = 0;
  let lastX = 0;
  let lastY = 0;
  let stackSize = 1;
  let pendingElements: PendingPick[] = [];
  let activePendingIndex = 0;
  let composerPrompt = "";
  let panelManuallyPlaced = false;
  let panelDrag: {
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
  } | null = null;
  let editingPickId: string | null = null;
  let onEditSaveCallback: ((pickId: string, comment: string) => void) | null = null;
  let onEditEndCallback: (() => void) | null = null;

  function getComposerEditor(): HTMLElement | null {
    return document.getElementById(CONTEXT_EDITOR_ID);
  }

  function ensureStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = buildPickerStyleSheet(features);
    document.documentElement.appendChild(s);
  }

  function ensureHint(): HTMLElement {
    let hint = document.getElementById(HINT_ID);
    if (!hint) {
      hint = document.createElement("div");
      hint.id = HINT_ID;
      hint.style.cssText =
        "position:fixed;z-index:2147483647;pointer-events:none;";
      document.documentElement.appendChild(hint);
      syncPickerColorScheme(hint);
    }
    return hint;
  }

  function ensureSelectedLayer(): HTMLElement | null {
    if (!features.pendingHighlights) return null;
    let layer = document.getElementById(SELECTED_ID);
    if (!layer) {
      layer = document.createElement("div");
      layer.id = SELECTED_ID;
      document.documentElement.appendChild(layer);
    }
    return layer;
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
      el.closest(`#${TRAY_ID}, #${CONTEXT_PANEL_ID}, #${HOVER_ID}, #${HINT_ID}`),
    );
  }

  function formatPickerIndexLabel(): string {
    if (phase === "hover" && stackSize > 1) {
      return `[${cycleIndex + 1}:${stackSize}]`;
    }
    const count = Math.max(pendingElements.length, 1);
    return `[${activePendingIndex + 1}:${count}]`;
  }

  function updateComposerPlaceholder(): void {
    const editor = getComposerEditor();
    if (!editor) return;
    editor.dataset.placeholder =
      pendingElements.length > 0 ? "" : COMPOSER_PLACEHOLDER;
  }

  function updatePendingHighlights(): void {
    if (!features.pendingHighlights) return;
    ensureStyle();
    const layer = ensureSelectedLayer();
    if (!layer) return;
    layer.innerHTML = "";

    const min = 3;
    pendingElements.forEach((item, index) => {
      const r = item.el.getBoundingClientRect();
      const box = document.createElement("div");
      box.className =
        index === activePendingIndex ? "grip-selected-active" : "grip-selected";
      box.style.top = `${r.top}px`;
      box.style.left = `${r.left}px`;
      box.style.width = `${Math.max(r.width, min)}px`;
      box.style.height = `${Math.max(r.height, min)}px`;
      layer.appendChild(box);
    });
  }

  function withComposerState(fn: () => void): void {
    if (!features.composerPromptSnapshot) {
      fn();
      return;
    }

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

  function updatePendingUI(): void {
    const run = () => {
      const editor = getComposerEditor();
      if (editor) {
        updateChipActiveStates(
          editor,
          pendingElements[activePendingIndex]?.chipId,
        );
      }
      const sessionLabel = document.getElementById(SESSION_LABEL_ID);
      if (sessionLabel) {
        sessionLabel.textContent = formatPickerIndexLabel();
      }
      updateComposerPlaceholder();
      updatePendingHighlights();
    };

    if (features.composerPromptSnapshot) {
      withComposerState(run);
    } else {
      run();
    }
  }

  function syncComposerEditor(editor?: HTMLElement | null): void {
    if (!features.composerPromptSnapshot) return;
    const el = editor ?? getComposerEditor();
    if (!el) return;
    composerPrompt = serializeEditor(el);
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

  function positionContextPanel(
    panel: HTMLElement,
    el: Element,
    force = false,
  ): void {
    if (features.panelDrag && panelManuallyPlaced && !force) return;

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

  function centerContextPanel(panel: HTMLElement): void {
    panel.style.display = "block";
    panel.style.visibility = "hidden";
    panel.style.left = "0";
    panel.style.top = "0";

    const panelRect = panel.getBoundingClientRect();
    const top = clamp(
      window.innerHeight / 2 - panelRect.height / 2,
      VIEWPORT_PAD,
      window.innerHeight - VIEWPORT_PAD - panelRect.height,
    );
    const left = clamp(
      window.innerWidth / 2 - panelRect.width / 2,
      VIEWPORT_PAD,
      window.innerWidth - VIEWPORT_PAD - panelRect.width,
    );

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.style.visibility = "visible";
  }

  function setupPanelDrag(panel: HTMLElement): void {
    if (!features.panelDrag) return;
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

  function ensureContextPanel(): HTMLElement {
    let panel = document.getElementById(CONTEXT_PANEL_ID);
    if (panel) return panel;

    const headerTitle = features.panelDrag ? ' title="Drag to move"' : "";
    panel = document.createElement("div");
    panel.id = CONTEXT_PANEL_ID;
    panel.className = "grip-context-panel";
    panel.setAttribute("aria-label", "Picker context panel");
    panel.style.cssText = features.panelDrag
      ? "position:fixed;z-index:2147483647;display:none;"
      : "";
    panel.innerHTML = `
    <div class="grip-picker-header"${headerTitle}>
      <span id="${SESSION_LABEL_ID}" class="grip-picker-session">[1:1]</span>
      <span class="grip-picker-hint">type · click add · drag</span>
    </div>
    <div class="grip-context-field">
      <div id="${CONTEXT_COMPOSER_ID}" class="grip-context-composer">
        <div
          id="${CONTEXT_EDITOR_ID}"
          class="grip-inline-editor"
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
          data-placeholder="${COMPOSER_PLACEHOLDER}"
        ></div>
      </div>
    </div>
    <div class="grip-picker-actions">
      <button type="button" id="${CONTEXT_CANCEL_ID}">Cancel</button>
      <button type="button" id="${CONTEXT_SAVE_ID}">Save</button>
    </div>
  `;
    document.documentElement.appendChild(panel);
    syncPickerColorScheme(panel);
    setupPanelDrag(panel);
    return panel;
  }

  function focusComposerEditor(): void {
    const editor = getComposerEditor();
    if (!editor) return;
    requestAnimationFrame(() => {
      focusEditor(editor, { caret: "end" });
    });
  }

  function bindComposerEvents(panel: HTMLElement): void {
    const composer = panel.querySelector(`#${CONTEXT_COMPOSER_ID}`);
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

    if (features.composerPromptSnapshot) {
      editor.addEventListener("input", () => {
        syncComposerEditor(editor);
      });
    }

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
        finishPick(serializeEditor(editor), false);
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

  function bindPanelActions(panel: HTMLElement): void {
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
      if (target.closest(`#${CONTEXT_SAVE_ID}`)) {
        e.preventDefault();
        e.stopPropagation();
        commitPanelSave();
        return;
      }
      if (target.closest(`#${CONTEXT_CANCEL_ID}`)) {
        e.stopPropagation();
        commitPanelCancel();
      }
    };

    actions.__gripActionsHandler = handler;
    actions.addEventListener("click", handler, true);
  }

  function addToPending(el: Element, options?: { keepTyping?: boolean }): void {
    const next = toPendingPick(el);
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
        if (features.composerPromptSnapshot) {
          composerPrompt = serializeEditor(editor);
        }
      }
    }

    highlight(el);
    updatePendingUI();

    const panel = document.getElementById(CONTEXT_PANEL_ID);
    if (panel && (!features.panelDrag || !panelManuallyPlaced) && !options?.keepTyping) {
      positionContextPanel(panel, el);
    }

    if (editor && !options?.keepTyping && inserted) {
      focusComposerEditor();
    }
  }

  function updateHover(x: number, y: number): void {
    lastX = x;
    lastY = y;
    const stack = stackAt(x, y);
    if (stack.length && cycleIndex >= stack.length) cycleIndex = 0;
    stackSize = Math.max(stack.length, 1);
    const el = targetAt(x, y, cycleIndex);
    if (!el || el.closest(`#${CONTEXT_PANEL_ID}`)) return;
    highlight(el);
  }

  function cycleSelection(dir: 1 | -1): void {
    if (stackSize <= 1) return;
    cycleIndex = (cycleIndex + dir + stackSize) % stackSize;
    const el = targetAt(lastX, lastY, cycleIndex);
    if (!el) return;
    if (phase === "context" || phase === "edit") {
      highlight(el);
      updatePendingUI();
      return;
    }
    highlight(el);
  }

  function isEventInComposer(e: KeyboardEvent): boolean {
    const editor = getComposerEditor();
    if (!editor) return false;
    return e.composedPath().some(
      (node) => node === editor || (node instanceof Node && editor.contains(node)),
    );
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
    const raw = features.composerPromptSnapshot
      ? (comment || composerPrompt).trim()
      : comment.trim();

    for (const item of pendingElements) {
      host.sendPick(item.el, raw);
    }

    document.getElementById(CONTEXT_PANEL_ID)?.remove();
    host.showTray();
    pendingElements = [];
    activePendingIndex = 0;
    composerPrompt = "";

    if (continueSession) {
      resumeHover();
      return;
    }
    host.onSessionEnd?.();
    cleanup();
  }

  function finishEdit(comment: string): void {
    if (!editingPickId) return;
    const tagsById = Object.fromEntries(
      pendingElements.map((item) => [item.chipId, item.tag]),
    );
    const raw = features.composerPromptSnapshot
      ? (comment || composerPrompt).trim()
      : comment.trim();
    const trimmed = formatInlineCommentForMcp(raw, tagsById);

    if (onEditSaveCallback) {
      onEditSaveCallback(editingPickId, trimmed);
    } else {
      host.updatePickComment(editingPickId, trimmed || undefined);
    }
    closeContextEditor();
  }

  function commitPanelSave(): void {
    const editor = getComposerEditor();
    const value = editor ? serializeEditor(editor) : "";
    if (phase === "edit") {
      finishEdit(value);
      return;
    }
    finishPick(value, false);
  }

  function commitPanelCancel(): void {
    if (phase === "edit") {
      closeContextEditor();
      return;
    }
    if (phase === "context") {
      resumeHover();
      return;
    }
    cleanup();
  }

  function closeContextEditor(): void {
    if (phase !== "edit") return;
    editingPickId = null;
    onEditSaveCallback = null;
    onEditEndCallback?.();
    onEditEndCallback = null;
    document.getElementById(CONTEXT_PANEL_ID)?.remove();
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
    if (features.panelDrag) {
      host.setPickerActive(false);
      host.showTray();
    } else {
      host.showTray({ restore: false });
    }
  }

  function revealContextPanel(panel: HTMLElement): void {
    requestAnimationFrame(() => {
      panel.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function showContextPanel(el: Element): void {
    const panel = document.getElementById(CONTEXT_PANEL_ID) ?? ensureContextPanel();
    syncAllPickerThemeElements();
    const isNewPanel = features.panelDrag ? phase !== "context" : true;

    if (isNewPanel) {
      if (features.panelDrag) {
        panelManuallyPlaced = false;
        panelDrag = null;
        phase = "context";
        document.getElementById(HINT_ID)?.remove();
      } else {
        phase = "context";
      }
    }

    const editor = panel.querySelector(`#${CONTEXT_EDITOR_ID}`) as HTMLElement;

    if (isNewPanel && features.panelDrag) {
      pendingElements = [];
      activePendingIndex = 0;
      composerPrompt = "";
      setEditorFromComment(editor, "", []);
    }

    addToPending(el);
    panel.style.display = "block";

    bindPanelActions(panel);

    if (!features.panelDrag || !panelManuallyPlaced) {
      positionContextPanel(panel, el, true);
    }

    if (features.panelDrag && isNewPanel) {
      const reposition = () => {
        const active = pendingElements[activePendingIndex]?.el;
        if (phase === "context" && active && !panelManuallyPlaced) {
          highlight(active);
          updatePendingHighlights();
          positionContextPanel(panel, active);
        }
      };
      window.addEventListener("resize", reposition, { once: true });
      window.addEventListener("scroll", reposition, { once: true, capture: true });
    }

    if (!features.panelDrag) {
      revealContextPanel(panel);
    }

    if (isNewPanel || !features.panelDrag) {
      focusComposerEditor();
    }
    syncComposerEditor(editor);
  }

  function onMove(e: MouseEvent): void {
    if (!host.isContextValid()) {
      cleanup();
      return;
    }
    if (phase !== "hover" && phase !== "context" && phase !== "edit") return;
    if (isGripChrome(e.target)) return;
    updateHover(e.clientX, e.clientY);
  }

  function onClick(e: MouseEvent): void {
    if (!host.isContextValid()) {
      cleanup();
      return;
    }
    if (phase !== "hover" && phase !== "context" && phase !== "edit") return;
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
      if (phase === "hover") {
        if (features.commentEscapeInComposerResumes) {
          stop({ notify: true });
        } else {
          cleanup();
        }
      }
      return;
    }

    if (phase === "context") {
      const editor = getComposerEditor();
      const keepTyping = document.activeElement === editor;
      addToPending(el, { keepTyping });
      return;
    }

    showContextPanel(el);
  }

  function onKey(e: KeyboardEvent): void {
    if (!host.isContextValid()) {
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
      if (phase === "context") {
        if (features.commentEscapeInComposerResumes) {
          if (isEventInComposer(e)) {
            resumeHover();
            return;
          }
        } else {
          if (isEventInComposer(e)) return;
          e.preventDefault();
          resumeHover();
          return;
        }
      }
      if (features.commentEscapeInComposerResumes) {
        stop({ notify: true });
      } else {
        cleanup();
      }
      return;
    }

    if ((phase === "context" || phase === "edit") && isEventInComposer(e)) return;

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

  function removeDom(): void {
    document.getElementById(HOVER_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(CONTEXT_PANEL_ID)?.remove();
    document.getElementById(HINT_ID)?.remove();
    document.getElementById(SELECTED_ID)?.remove();
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
  }

  function cleanup(): void {
    removeDom();
    phase = "idle";
    cycleIndex = 0;
    pendingElements = [];
    activePendingIndex = 0;
    composerPrompt = "";
    panelManuallyPlaced = false;
    panelDrag = null;
    editingPickId = null;
    onEditSaveCallback = null;
    onEditEndCallback = null;
    host.setPickerActive(false);
  }

  function stop(options?: PickerStopOptions): void {
    const notify = options?.notify ?? true;
    cleanup();
    if (notify) {
      host.showTray({ restore: options?.restore ?? true });
    }
  }

  function start(): void {
    cleanup();
    phase = "hover";
    cycleIndex = 0;
    ensureStyle();
    syncAllPickerThemeElements();
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    host.setPickerActive(true);
  }

  function openContextEditor(
    payload: OpenContextEditorPayload,
    options?: OpenContextEditorOptions,
  ): void {
    if (phase === "hover" || phase === "context") {
      if (features.commentEscapeInComposerResumes) {
        stop({ notify: false });
      } else {
        cleanup();
      }
    }

    const { pick } = payload;
    editingPickId = pick.id;
    onEditSaveCallback = options?.onEditSave ?? null;
    onEditEndCallback = options?.onEditEnd ?? null;
    ensureStyle();
    syncAllPickerThemeElements();
    const panel = ensureContextPanel();
    panelManuallyPlaced = false;
    panelDrag = null;
    phase = "edit";
    pendingElements = [];
    activePendingIndex = 0;
    composerPrompt = "";

    const { chips, comment } = composerStateForStoredPick(pick);
    const editor = panel.querySelector(`#${CONTEXT_EDITOR_ID}`) as HTMLElement;
    const inlineChips = storedPickChipsToInlineRefs(chips);
    setEditorFromComment(editor, comment, inlineChips, undefined, { caretAtEnd: true });
    const { pending, anchor } = syncPendingFromStoredChips(chips, pendingElements);
    pendingElements = pending;
    if (anchor) {
      highlight(anchor);
    }

    if (anchor) {
      positionContextPanel(panel, anchor, true);
    } else if (features.panelDrag) {
      panel.style.display = "block";
      panel.style.visibility = "visible";
      panel.style.top = `${Math.max(VIEWPORT_PAD, window.innerHeight / 2 - 80)}px`;
      panel.style.left = `${Math.max(VIEWPORT_PAD, window.innerWidth / 2 - 160)}px`;
    } else {
      centerContextPanel(panel);
    }

    bindPanelActions(panel);
    revealContextPanel(panel);

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    updatePendingUI();
    focusComposerEditor();
    syncComposerEditor(editor);
  }

  function isActive(): boolean {
    return phase !== "idle";
  }

  return {
    start,
    stop,
    cleanup,
    openContextEditor,
    isActive,
  };
}
