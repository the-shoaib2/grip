const FLASH_ID = "__grip_flash__";

export function queryDeep(css: string, root: Document | ShadowRoot = document): Element | null {
  const parts = css.split(" >>> ").map((p) => p.trim());
  let el: Element | null = root.querySelector(parts[0] ?? "");
  for (let i = 1; i < parts.length && el; i++) {
    const part = parts[i];
    if (!part) break;
    el = el.shadowRoot?.querySelector(part) ?? null;
  }
  return el;
}

export function navigateToSelector(css: string): Element | null {
  const el = queryDeep(css);
  if (!el) return null;
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  flashElement(el);
  return el;
}

export function flashElement(el: Element): void {
  document.getElementById(FLASH_ID)?.remove();
  const r = el.getBoundingClientRect();

  const box = document.createElement("div");
  box.id = FLASH_ID;
  box.style.cssText = [
    "position:fixed",
    "pointer-events:none",
    "z-index:2147483645",
    `top:${r.top}px`,
    `left:${r.left}px`,
    `width:${Math.max(r.width, 1)}px`,
    `height:${Math.max(r.height, 1)}px`,
    "border:1px dashed #22c55e",
    "border-radius:0",
    "background:rgba(34,197,94,0.1)",
    "box-shadow:none",
    "transition:opacity 0.4s ease",
  ].join(";");
  document.documentElement.appendChild(box);
  setTimeout(() => {
    box.style.opacity = "0";
    setTimeout(() => box.remove(), 400);
  }, 1200);
}
