import { generateSelector } from "@grip/core";

const HOVER_ID = "__grip_picker_hover__";
let pickerActive = false;

function cleanup(): void {
  document.getElementById(HOVER_ID)?.remove();
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  pickerActive = false;
}

function onMove(e: MouseEvent): void {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || el.id === HOVER_ID) return;
  let hover = document.getElementById(HOVER_ID);
  if (!hover) {
    hover = document.createElement("div");
    hover.id = HOVER_ID;
    hover.style.cssText =
      "position:fixed;pointer-events:none;z-index:2147483646;border:2px dashed #2563eb;background:rgba(37,99,235,0.1);";
    document.documentElement.appendChild(hover);
  }
  const r = el.getBoundingClientRect();
  hover.style.top = `${r.top}px`;
  hover.style.left = `${r.left}px`;
  hover.style.width = `${r.width}px`;
  hover.style.height = `${r.height}px`;
}

function onClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
  const el = document.elementFromPoint(e.clientX, e.clientY);
  cleanup();
  if (!el) return;
  const { css, xpath, inShadowDom } = generateSelector(el);
  const r = el.getBoundingClientRect();
  chrome.runtime.sendMessage({
    type: "PICKER_ELEMENT_SELECTED",
    payload: {
      css,
      xpath,
      role: el.getAttribute("role") ?? el.tagName.toLowerCase(),
      name: el.getAttribute("aria-label") ?? "",
      rect: { top: r.top, left: r.left, width: r.width, height: r.height },
      shadowDOM: inShadowDom,
      iframe: window !== window.top ? location.href : "none",
      innerText: (el.textContent ?? "").slice(0, 80),
    },
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "START_PICKER" && !pickerActive) {
    pickerActive = true;
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
  }
  if (msg.type === "STOP_PICKER") cleanup();
});
