import {
  deepElementFromPoint,
  describeElement,
  elementsAtPoint,
} from "@grip/core";
import { isExtensionContextValid, safeSendMessage } from "@/lib";

const HOVER_ID = "__grip_picker_hover__";
const STYLE_ID = "__grip_picker_style__";
const COMMENT_ID = "__grip_picker_comment__";
const HINT_ID = "__grip_picker_hint__";
let pickerActive = false;
let cycleIndex = 0;
let lastX = 0;
let lastY = 0;
let stackSize = 1;

function cleanup(): void {
  document.getElementById(HOVER_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
  document.getElementById(COMMENT_ID)?.remove();
  document.getElementById(HINT_ID)?.remove();
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("keydown", onKey, true);
  pickerActive = false;
  cycleIndex = 0;
}

function onKey(e: KeyboardEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if (e.key === "Escape") cleanup();
  if (!pickerActive) return;
  if (e.key === "[" || e.key === "ArrowDown") {
    e.preventDefault();
    cycleIndex = (cycleIndex + 1) % Math.max(stackSize, 1);
    updateHover(lastX, lastY);
  }
  if (e.key === "]" || e.key === "ArrowUp") {
    e.preventDefault();
    cycleIndex = (cycleIndex - 1 + Math.max(stackSize, 1)) % Math.max(stackSize, 1);
    updateHover(lastX, lastY);
  }
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    *{cursor:crosshair!important}
    #${HOVER_ID},#${HINT_ID}{pointer-events:none!important}
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
      "position:fixed;z-index:2147483647;padding:4px 8px;border-radius:9999px;background:#18181b;color:#a1a1aa;font:10px system-ui,sans-serif;border:1px solid #3f3f46;";
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

  const hint = ensureHint();
  const tag = el.tagName.toLowerCase();
  const cycle =
    stackSize > 1 ? ` · ${cycleIndex + 1}/${stackSize}` : "";
  hint.textContent = `${tag}${cycle} · [ ] cycle`;
  hint.style.top = `${Math.max(4, r.top - 22)}px`;
  hint.style.left = `${Math.min(window.innerWidth - 120, r.left)}px`;
}

function currentTarget(x: number, y: number): Element | null {
  const stack = elementsAtPoint(x, y);
  stackSize = Math.max(stack.length, 1);
  if (stack.length) return stack[cycleIndex % stack.length] ?? null;
  return deepElementFromPoint(x, y);
}

function updateHover(x: number, y: number): void {
  lastX = x;
  lastY = y;
  const el = currentTarget(x, y);
  if (!el || el.id === HOVER_ID || el.closest(`#${COMMENT_ID}`)) return;
  highlight(el);
}

function onMove(e: MouseEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if ((e.target as Element).closest?.(`#${COMMENT_ID}`)) return;
  const stack = elementsAtPoint(e.clientX, e.clientY);
  if (stack.length && cycleIndex >= stack.length) cycleIndex = 0;
  stackSize = Math.max(stack.length, 1);
  updateHover(e.clientX, e.clientY);
}

function sendPick(el: Element, comment: string): void {
  const payload = { ...describeElement(el), comment: comment.trim() || undefined };
  safeSendMessage({ type: "PICKER_ELEMENT_SELECTED", payload });
}

function showCommentPrompt(el: Element): void {
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.getElementById(HINT_ID)?.remove();

  let panel = document.getElementById(COMMENT_ID);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = COMMENT_ID;
    panel.style.cssText =
      "position:fixed;z-index:2147483647;left:50%;bottom:20px;transform:translateX(-50%);width:min(360px,calc(100vw - 24px));padding:12px;border-radius:20px;background:#18181b;border:1px solid #3f3f46;box-shadow:0 12px 40px rgba(0,0,0,.45);font:12px system-ui,sans-serif;color:#fafafa;";
    panel.innerHTML = `
      <input id="__grip_comment_input__" type="text" placeholder="Context (optional)" style="width:100%;box-sizing:border-box;border-radius:9999px;border:1px solid #3f3f46;background:#09090b;color:#fafafa;padding:10px 14px;font-size:12px;outline:none" />
      <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end">
        <button type="button" id="__grip_comment_skip__" style="border-radius:9999px;border:none;background:#27272a;color:#d4d4d8;padding:7px 14px;font-size:11px;cursor:pointer">Skip</button>
        <button type="button" id="__grip_comment_done__" style="border-radius:9999px;border:none;background:#2563eb;color:#fff;padding:7px 14px;font-size:11px;cursor:pointer">Save</button>
      </div>
    `;
    document.documentElement.appendChild(panel);
  }

  const input = panel.querySelector("#__grip_comment_input__") as HTMLInputElement;
  const done = panel.querySelector("#__grip_comment_done__") as HTMLButtonElement;
  const skip = panel.querySelector("#__grip_comment_skip__") as HTMLButtonElement;

  const finish = (comment: string) => {
    cleanup();
    sendPick(el, comment);
    safeSendMessage({ type: "SHOW_TRAY" });
  };

  done.onclick = () => finish(input.value);
  skip.onclick = () => finish("");
  input.onkeydown = (e) => {
    if (e.key === "Enter") finish(input.value);
    if (e.key === "Escape") finish("");
  };
  input.focus();
}

function onClick(e: MouseEvent): void {
  if (!isExtensionContextValid()) {
    cleanup();
    return;
  }
  if ((e.target as Element).closest?.(`#${COMMENT_ID}`)) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  const el = currentTarget(e.clientX, e.clientY);
  if (!el) {
    cleanup();
    return;
  }
  showCommentPrompt(el);
}

function startPicker(): void {
  cleanup();
  pickerActive = true;
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
