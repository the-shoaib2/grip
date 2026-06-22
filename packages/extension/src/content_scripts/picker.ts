import { describeElement, elementFromComposedEvent } from "@grip/core";

const HOVER_ID = "__grip_picker_hover__";
const STYLE_ID = "__grip_picker_style__";
let pickerActive = false;

function cleanup(): void {
  document.getElementById(HOVER_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("keydown", onKey, true);
  pickerActive = false;
}

function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape") cleanup();
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `*{cursor:crosshair!important}#${HOVER_ID}{pointer-events:none!important}`;
  document.documentElement.appendChild(s);
}

function highlight(el: Element): void {
  let hover = document.getElementById(HOVER_ID);
  if (!hover) {
    hover = document.createElement("div");
    hover.id = HOVER_ID;
    hover.style.cssText =
      "position:fixed;z-index:2147483646;border:2px solid #3b82f6;border-radius:6px;background:rgba(59,130,246,0.12);box-shadow:0 0 0 1px rgba(59,130,246,0.3);transition:all 80ms ease;";
    document.documentElement.appendChild(hover);
  }
  const r = el.getBoundingClientRect();
  hover.style.top = `${r.top}px`;
  hover.style.left = `${r.left}px`;
  hover.style.width = `${r.width}px`;
  hover.style.height = `${r.height}px`;
}

function onMove(e: MouseEvent): void {
  const el = elementFromComposedEvent(e);
  if (!el || el.id === HOVER_ID) return;
  highlight(el);
}

function onClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  const el = elementFromComposedEvent(e);
  cleanup();
  if (!el) return;

  const payload = describeElement(el);
  chrome.runtime.sendMessage(
    { type: "PICKER_ELEMENT_SELECTED", payload },
    () => {
      void chrome.runtime.lastError;
    },
  );
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "START_PICKER" && !pickerActive) {
    pickerActive = true;
    ensureStyle();
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
  }
  if (msg.type === "STOP_PICKER") cleanup();
});
