import type { StoredPick } from "@grip/core";
import { navigateToSelector } from "@/content_scripts/navigator";

export const TRAY_ID = "__grip_tray__";
const STYLE_ID = "__grip_tray_style__";

let open = false;
let picks: StoredPick[] = [];
let trayRoot: HTMLDivElement | null = null;
let menuEl: HTMLDivElement | null = null;
let badgesEl: HTMLDivElement | null = null;
let toggleEl: HTMLButtonElement | null = null;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${TRAY_ID}{
      position:fixed;
      top:12px;
      right:12px;
      z-index:2147483645;
      display:flex;
      flex-direction:column;
      align-items:flex-end;
      gap:8px;
      font:12px system-ui,sans-serif;
      pointer-events:auto;
    }
    #${TRAY_ID} .grip-tray-toggle{
      border:none;
      border-radius:9999px;
      width:36px;
      height:36px;
      background:#2563eb;
      color:#fff;
      cursor:pointer;
      box-shadow:0 4px 14px rgba(0,0,0,.35);
      display:flex;
      align-items:center;
      justify-content:center;
      transition:transform .15s ease,background .15s ease;
      flex-shrink:0;
    }
    #${TRAY_ID} .grip-tray-toggle:hover{background:#1d4ed8}
    #${TRAY_ID}.grip-tray-open .grip-tray-toggle{
      transform:rotate(180deg);
      background:#1d4ed8;
    }
    #${TRAY_ID} .grip-tray-menu{
      display:none;
      width:min(280px,calc(100vw - 24px));
      max-height:240px;
      overflow:auto;
      border-radius:16px;
      background:#18181b;
      border:1px solid #3f3f46;
      box-shadow:0 12px 40px rgba(0,0,0,.45);
      padding:8px;
      order:-1;
    }
    #${TRAY_ID}.grip-tray-open .grip-tray-menu{display:block}
    #${TRAY_ID} .grip-tray-badges{display:flex;flex-wrap:wrap;gap:6px}
    #${TRAY_ID} .grip-tray-badge{
      border:none;
      border-radius:9999px;
      padding:6px 10px;
      background:#27272a;
      color:#e4e4e7;
      font-size:11px;
      cursor:pointer;
      max-width:100%;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    #${TRAY_ID} .grip-tray-badge:hover{background:#3b82f6;color:#fff}
    #${TRAY_ID} .grip-tray-empty{margin:0;padding:6px 10px;color:#71717a;font-size:11px}
  `;
  document.documentElement.appendChild(style);
}

function ensureTray(): HTMLDivElement {
  if (trayRoot) return trayRoot;

  ensureStyle();
  trayRoot = document.createElement("div");
  trayRoot.id = TRAY_ID;

  menuEl = document.createElement("div");
  menuEl.className = "grip-tray-menu";
  badgesEl = document.createElement("div");
  badgesEl.className = "grip-tray-badges";
  menuEl.appendChild(badgesEl);

  toggleEl = document.createElement("button");
  toggleEl.type = "button";
  toggleEl.className = "grip-tray-toggle";
  toggleEl.setAttribute("aria-label", "Grip picks");
  toggleEl.setAttribute("aria-expanded", "false");
  toggleEl.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden>
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  `;

  toggleEl.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    open = !open;
    updateTray();
  });

  badgesEl.addEventListener("click", (e) => {
    const badge = (e.target as HTMLElement).closest<HTMLButtonElement>(".grip-tray-badge");
    if (!badge?.dataset.id) return;
    e.preventDefault();
    e.stopPropagation();
    const pick = picks.find((p) => p.id === badge.dataset.id);
    if (!pick) return;
    navigateToSelector(pick.css);
    chrome.runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick });
    open = false;
    updateTray();
  });

  trayRoot.appendChild(menuEl);
  trayRoot.appendChild(toggleEl);
  document.documentElement.appendChild(trayRoot);
  return trayRoot;
}

function updateBadges(): void {
  if (!badgesEl) return;
  if (!picks.length) {
    badgesEl.innerHTML = `<p class="grip-tray-empty">No picks</p>`;
    return;
  }
  badgesEl.innerHTML = picks
    .map(
      (p) =>
        `<button type="button" data-id="${p.id}" class="grip-tray-badge" title="${escapeAttr(p.css)}">${escapeHtml(p.label)}</button>`,
    )
    .join("");
}

function updateTray(): void {
  const tray = ensureTray();
  tray.classList.toggle("grip-tray-open", open);
  toggleEl?.setAttribute("aria-expanded", open ? "true" : "false");
  updateBadges();
}

export function setTrayPicks(next: StoredPick[]): void {
  picks = next;
  if (document.getElementById(TRAY_ID) || open) updateTray();
}

export function toggleTray(): void {
  open = !open;
  updateTray();
}

export function showTray(): void {
  open = true;
  updateTray();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "TOGGLE_GRIP_TRAY") {
    toggleTray();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "NAVIGATE_TO_PICK" && msg.payload?.css) {
    navigateToSelector(msg.payload.css);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "UPDATE_TRAY_PICKS") {
    setTrayPicks(msg.payload ?? []);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "SHOW_TRAY") {
    showTray();
    sendResponse({ ok: true });
    return true;
  }
});

if (/^https?:/i.test(location.href)) {
  chrome.runtime.sendMessage({ type: "GET_PICK_HISTORY" }, (data: { history?: StoredPick[] }) => {
    if (!chrome.runtime.lastError && data?.history?.length) picks = data.history;
    updateTray();
  });
}
