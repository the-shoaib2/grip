import type { StoredPick } from "@grip/core";
import { navigateToSelector } from "@/content_scripts/navigator";

const TRAY_ID = "__grip_tray__";

let open = false;
let picks: StoredPick[] = [];
let bound = false;

function render(): void {
  let tray = document.getElementById(TRAY_ID);
  if (!tray) {
    tray = document.createElement("div");
    tray.id = TRAY_ID;
    document.documentElement.appendChild(tray);
  }

  const list =
    picks.length === 0
      ? `<p class="grip-tray-empty">No picks</p>`
      : picks
          .map(
            (p) =>
              `<button type="button" data-id="${p.id}" class="grip-tray-badge" title="${escapeAttr(p.css)}">${escapeHtml(p.label)}</button>`,
          )
          .join("");

  tray.innerHTML = `
    <style>
      #${TRAY_ID}{position:fixed;top:12px;right:12px;z-index:2147483644;font:12px system-ui,sans-serif}
      #${TRAY_ID} .grip-tray-toggle{border:none;border-radius:9999px;width:36px;height:36px;background:#2563eb;color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center}
      #${TRAY_ID} .grip-tray-menu{display:${open ? "block" : "none"};margin-top:8px;max-width:280px;max-height:240px;overflow:auto;border-radius:16px;background:#18181b;border:1px solid #3f3f46;box-shadow:0 12px 40px rgba(0,0,0,.45);padding:8px}
      #${TRAY_ID} .grip-tray-badges{display:flex;flex-wrap:wrap;gap:6px}
      #${TRAY_ID} .grip-tray-badge{border:none;border-radius:9999px;padding:6px 10px;background:#27272a;color:#e4e4e7;font-size:11px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #${TRAY_ID} .grip-tray-badge:hover{background:#3b82f6;color:#fff}
      #${TRAY_ID} .grip-tray-empty{margin:0;padding:6px 10px;color:#71717a;font-size:11px}
    </style>
    <button type="button" class="grip-tray-toggle" aria-label="Grip picks">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </button>
    <div class="grip-tray-menu"><div class="grip-tray-badges">${list}</div></div>
  `;

  if (!bound) {
    bound = true;
    tray.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t.closest(".grip-tray-toggle")) {
        open = !open;
        render();
        return;
      }
      const badge = t.closest<HTMLButtonElement>(".grip-tray-badge");
      if (!badge?.dataset.id) return;
      const pick = picks.find((p) => p.id === badge.dataset.id);
      if (!pick) return;
      navigateToSelector(pick.css);
      chrome.runtime.sendMessage({ type: "NAVIGATE_TO_PICK", payload: pick });
      open = false;
      render();
    });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

export function setTrayPicks(next: StoredPick[]): void {
  picks = next;
  if (document.getElementById(TRAY_ID) || open) render();
}

export function toggleTray(): void {
  open = !open;
  render();
}

export function showTray(): void {
  open = true;
  render();
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "TOGGLE_GRIP_TRAY") toggleTray();
  if (msg.type === "NAVIGATE_TO_PICK" && msg.payload?.css) {
    navigateToSelector(msg.payload.css);
  }
  if (msg.type === "UPDATE_TRAY_PICKS") {
    setTrayPicks(msg.payload ?? []);
  }
  if (msg.type === "SHOW_TRAY") showTray();
});

// Tray toggle on page (http/https only)
if (/^https?:/i.test(location.href)) {
  chrome.runtime.sendMessage({ type: "GET_PICK_HISTORY" }, (data: { history?: StoredPick[] }) => {
    if (!chrome.runtime.lastError && data?.history?.length) picks = data.history;
    render();
  });
}
