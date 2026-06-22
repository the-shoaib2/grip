import { chipDisplayLabel } from "@grip/core";

const TOOLTIP_ID = "__grip_chip_tooltip__";
const SHOW_MS = 220;
const HIDE_MS = 60;
const VIEWPORT_PAD = 8;
const GAP = 6;

export interface ChipTooltipMeta {
  tag: string;
  role?: string;
  css?: string;
  text?: string;
  name?: string;
}

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let activeAnchor: HTMLElement | null = null;

function clearTimers(): void {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
  showTimer = null;
  hideTimer = null;
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function ensureTooltip(): HTMLElement {
  let tip = document.getElementById(TOOLTIP_ID);
  if (tip) return tip;

  tip = document.createElement("div");
  tip.id = TOOLTIP_ID;
  tip.className = "grip-chip-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.documentElement.appendChild(tip);
  return tip;
}

function renderTooltip(tip: HTMLElement, meta: ChipTooltipMeta): void {
  const tag = chipDisplayLabel(meta.tag);
  const role = meta.role?.trim().toLowerCase() ?? "";
  const showRole = Boolean(role && role !== meta.tag.toLowerCase());
  const snippet = truncate(meta.text?.trim() || meta.name?.trim() || "", 72);
  const css = truncate(meta.css?.trim() || "", 96);

  const roleHtml = showRole
    ? `<span class="grip-chip-tooltip-role">${role}</span>`
    : "";
  const textHtml = snippet
    ? `<p class="grip-chip-tooltip-text">"${escapeHtml(snippet)}"</p>`
    : "";
  const cssHtml = css
    ? `<p class="grip-chip-tooltip-css">${escapeHtml(css)}</p>`
    : "";

  tip.innerHTML = `
    <div class="grip-chip-tooltip-head">
      <span class="grip-chip-tooltip-tag">${escapeHtml(tag)}</span>
      ${roleHtml}
    </div>
    ${textHtml}
    ${cssHtml}
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function positionTooltip(tip: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const box = tip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = rect.top - GAP - box.height;
  if (top < VIEWPORT_PAD) {
    top = rect.bottom + GAP;
  }

  let left = rect.left + rect.width / 2 - box.width / 2;
  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - VIEWPORT_PAD - box.width));
  top = Math.max(VIEWPORT_PAD, Math.min(top, vh - VIEWPORT_PAD - box.height));

  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
}

export function hideChipTooltip(): void {
  clearTimers();
  activeAnchor = null;
  const tip = document.getElementById(TOOLTIP_ID);
  if (!tip) return;
  tip.hidden = true;
}

export function showChipTooltip(anchor: HTMLElement, meta: ChipTooltipMeta): void {
  if (!meta.tag) return;
  clearTimers();
  activeAnchor = anchor;

  const tip = ensureTooltip();
  renderTooltip(tip, meta);
  tip.hidden = false;
  tip.style.top = "-9999px";
  tip.style.left = "-9999px";
  requestAnimationFrame(() => {
    if (activeAnchor !== anchor) return;
    positionTooltip(tip, anchor);
  });
}

export function scheduleChipTooltip(
  anchor: HTMLElement,
  meta: ChipTooltipMeta,
): void {
  clearTimers();
  showTimer = setTimeout(() => showChipTooltip(anchor, meta), SHOW_MS);
}

export function deferHideChipTooltip(): void {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => hideChipTooltip(), HIDE_MS);
}

export function bindChipTooltipRoot(
  root: HTMLElement,
  resolveMeta: (chip: HTMLElement) => ChipTooltipMeta | null,
): () => void {
  const onOver = (e: Event) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>(".grip-inline-chip");
    if (!chip || !root.contains(chip)) return;
    if (activeAnchor === chip) return;
    const meta = resolveMeta(chip);
    if (!meta) return;
    scheduleChipTooltip(chip, meta);
  };

  const onOut = (e: Event) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>(".grip-inline-chip");
    if (!chip || !root.contains(chip)) return;
    const related = (e as MouseEvent).relatedTarget as Node | null;
    if (related && chip.contains(related)) return;
    deferHideChipTooltip();
  };

  const onScroll = () => hideChipTooltip();

  root.addEventListener("mouseover", onOver);
  root.addEventListener("mouseout", onOut);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);

  return () => {
    root.removeEventListener("mouseover", onOver);
    root.removeEventListener("mouseout", onOut);
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onScroll);
    hideChipTooltip();
  };
}

export function bindTrayBadgeTooltips(
  root: HTMLElement,
  resolveMeta: (badge: HTMLElement) => ChipTooltipMeta | null,
): () => void {
  const onOver = (e: Event) => {
    const badge = (e.target as HTMLElement).closest<HTMLElement>(".grip-tray-badge");
    if (!badge || !root.contains(badge)) return;
    if (activeAnchor === badge) return;
    const meta = resolveMeta(badge);
    if (!meta) return;
    scheduleChipTooltip(badge, meta);
  };

  const onOut = (e: Event) => {
    const badge = (e.target as HTMLElement).closest<HTMLElement>(".grip-tray-badge");
    if (!badge || !root.contains(badge)) return;
    const related = (e as MouseEvent).relatedTarget as Node | null;
    if (related && badge.contains(related)) return;
    deferHideChipTooltip();
  };

  root.addEventListener("mouseover", onOver);
  root.addEventListener("mouseout", onOut);

  return () => {
    root.removeEventListener("mouseover", onOver);
    root.removeEventListener("mouseout", onOut);
  };
}
