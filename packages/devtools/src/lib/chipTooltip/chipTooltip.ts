import { badgeDisplayLabel, badgeStateIndicator, chipDisplayLabel } from "grip-dev";

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
  component?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  framework?: string;
  state?: string;
  parentComponents?: string[];
  childComponents?: string[];
  createdAt?: number;
  updatedAt?: number;
  id?: string;
  frameworkContext?: {
    framework: string;
    file?: string;
    line?: number;
    componentName?: string;
  } | null;
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

function formatTs(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
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
  const component = meta.component ?? meta.frameworkContext?.componentName ?? meta.tag;
  const tag = component
    ? badgeDisplayLabel({ component, tag: meta.tag })
    : chipDisplayLabel(meta.tag);
  const role = meta.role?.trim().toLowerCase() ?? "";
  const showRole = Boolean(role && role !== meta.tag.toLowerCase());
  const snippet = truncate(meta.text?.trim() || meta.name?.trim() || "", 72);
  const css = truncate(meta.css?.trim() || "", 96);

  const file =
    meta.filePath ??
    meta.frameworkContext?.file;
  const lineStart = meta.lineStart ?? meta.frameworkContext?.line;
  const lineEnd = meta.lineEnd ?? lineStart;
  const framework = meta.framework ?? meta.frameworkContext?.framework;
  const state = meta.state ? badgeStateIndicator(meta.state as never) : "";

  const roleHtml = showRole
    ? `<span class="grip-chip-tooltip-role">${escapeHtml(role)}</span>`
    : "";
  const textHtml = snippet
    ? `<p class="grip-chip-tooltip-text">"${escapeHtml(snippet)}"</p>`
    : "";
  const sourceHtml = file
    ? `<p class="grip-chip-tooltip-row"><span class="grip-chip-tooltip-k">File</span> ${escapeHtml(file)}</p>`
    : "";
  const lineHtml =
    lineStart !== undefined
      ? `<p class="grip-chip-tooltip-row"><span class="grip-chip-tooltip-k">Lines</span> ${lineStart}${lineEnd !== lineStart ? `–${lineEnd}` : ""}</p>`
      : "";
  const fwHtml = framework
    ? `<p class="grip-chip-tooltip-row"><span class="grip-chip-tooltip-k">Framework</span> ${escapeHtml(framework)}${state ? ` ${state}` : ""}</p>`
    : "";
  const parentHtml = meta.parentComponents?.length
    ? `<p class="grip-chip-tooltip-row"><span class="grip-chip-tooltip-k">Parent</span> ${escapeHtml(meta.parentComponents.join(", "))}</p>`
    : "";
  const childHtml = meta.childComponents?.length
    ? `<p class="grip-chip-tooltip-row"><span class="grip-chip-tooltip-k">Children</span> ${escapeHtml(meta.childComponents.join(", "))}</p>`
    : "";
  const metaHtml = `<p class="grip-chip-tooltip-row grip-chip-tooltip-meta"><span class="grip-chip-tooltip-k">Updated</span> ${escapeHtml(formatTs(meta.updatedAt))}</p>`;
  const idHtml = meta.id
    ? `<p class="grip-chip-tooltip-row grip-chip-tooltip-meta"><span class="grip-chip-tooltip-k">ID</span> ${escapeHtml(meta.id)}</p>`
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
    ${sourceHtml}
    ${lineHtml}
    ${fwHtml}
    ${parentHtml}
    ${childHtml}
    ${metaHtml}
    ${idHtml}
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
