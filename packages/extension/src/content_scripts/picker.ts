import { describeElement, elementFromComposedEvent } from "@grip/core";

const HOVER_ID = "__grip_picker_hover__";
const STYLE_ID = "__grip_picker_style__";
const COMMENT_ID = "__grip_picker_comment__";
let pickerActive = false;

function cleanup(): void {
  document.getElementById(HOVER_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
  document.getElementById(COMMENT_ID)?.remove();
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
      "position:fixed;z-index:2147483646;border:2px solid #3b82f6;border-radius:12px;background:rgba(59,130,246,0.12);box-shadow:0 0 0 1px rgba(59,130,246,0.3);transition:all 80ms ease;";
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
  if (!el || el.id === HOVER_ID || el.closest(`#${COMMENT_ID}`)) return;
  highlight(el);
}

function sendPick(el: Element, comment: string): void {
  const payload = { ...describeElement(el), comment: comment.trim() || undefined };
  chrome.runtime.sendMessage(
    { type: "PICKER_ELEMENT_SELECTED", payload },
    () => {
      void chrome.runtime.lastError;
    },
  );
}

function showCommentPrompt(el: Element): void {
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);

  let panel = document.getElementById(COMMENT_ID);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = COMMENT_ID;
    panel.style.cssText =
      "position:fixed;z-index:2147483647;left:50%;bottom:24px;transform:translateX(-50%);width:min(420px,calc(100vw - 32px));padding:16px;border-radius:24px;background:#18181b;border:1px solid #3f3f46;box-shadow:0 16px 48px rgba(0,0,0,0.45);font:12px system-ui,sans-serif;color:#fafafa;";
    panel.innerHTML = `
      <p style="margin:0 0 4px;font-weight:600;font-size:13px">Add context</p>
      <p style="margin:0 0 10px;color:#a1a1aa;font-size:11px">Optional note for the MCP prompt — what should the agent do?</p>
      <textarea id="__grip_comment_input__" rows="3" placeholder="e.g. click this to submit the login form" style="width:100%;box-sizing:border-box;resize:none;border-radius:16px;border:1px solid #3f3f46;background:#09090b;color:#fafafa;padding:12px 14px;font-size:12px;outline:none"></textarea>
      <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
        <button type="button" id="__grip_comment_skip__" style="border-radius:9999px;border:none;background:#27272a;color:#d4d4d8;padding:8px 16px;font-size:12px;cursor:pointer">Skip</button>
        <button type="button" id="__grip_comment_done__" style="border-radius:9999px;border:none;background:#2563eb;color:#fff;padding:8px 16px;font-size:12px;cursor:pointer;font-weight:500">Done</button>
      </div>
    `;
    document.documentElement.appendChild(panel);
  }

  const input = panel.querySelector("#__grip_comment_input__") as HTMLTextAreaElement;
  const done = panel.querySelector("#__grip_comment_done__") as HTMLButtonElement;
  const skip = panel.querySelector("#__grip_comment_skip__") as HTMLButtonElement;

  const finish = (comment: string) => {
    cleanup();
    sendPick(el, comment);
  };

  done.onclick = () => finish(input.value);
  skip.onclick = () => finish("");
  input.onkeydown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) finish(input.value);
    if (e.key === "Escape") finish("");
  };
  input.focus();
}

function onClick(e: MouseEvent): void {
  if ((e.target as Element).closest(`#${COMMENT_ID}`)) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  const el = elementFromComposedEvent(e);
  if (!el) {
    cleanup();
    return;
  }
  showCommentPrompt(el);
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
