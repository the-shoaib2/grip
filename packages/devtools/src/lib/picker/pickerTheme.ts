import { CONTEXT_PANEL_ID, HINT_ID, TRAY_ID } from "@devtools/lib/picker/constants";

export const CHIP_TOOLTIP_ID = "__grip_chip_tooltip__";

export type GripColorScheme = "light" | "dark";

export const PICKER_THEME_SCOPE = `#${CONTEXT_PANEL_ID}, #${HINT_ID}, #${CHIP_TOOLTIP_ID}`;

export function resolveGripColorScheme(): GripColorScheme {
  const trayScheme = document.getElementById(TRAY_ID)?.getAttribute("data-color-scheme");
  if (trayScheme === "light" || trayScheme === "dark") {
    return trayScheme;
  }

  const rootScheme = document.documentElement.getAttribute("data-color-scheme");
  if (rootScheme === "light" || rootScheme === "dark") {
    return rootScheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Keep the page picker panel aligned with the floating tray color scheme. */
export function syncPickerColorScheme(panel: HTMLElement): void {
  const trayScheme = document.getElementById(TRAY_ID)?.getAttribute("data-color-scheme");
  const rootScheme = document.documentElement.getAttribute("data-color-scheme");
  const scheme = trayScheme ?? rootScheme;

  if (scheme === "light" || scheme === "dark") {
    panel.setAttribute("data-color-scheme", scheme);
    return;
  }

  panel.removeAttribute("data-color-scheme");
}

export function syncAllPickerThemeElements(): void {
  for (const id of [CONTEXT_PANEL_ID, HINT_ID, CHIP_TOOLTIP_ID]) {
    const element = document.getElementById(id);
    if (element) syncPickerColorScheme(element);
  }
}

export function buildScopedThemeTokens(panelSelector: string, tokensCss: string): string {
  const darkSelector = panelSelector
    .split(",")
    .map((part) => `${part.trim()}[data-color-scheme="dark"]`)
    .join(", ");
  const prefersDarkSelector = panelSelector
    .split(",")
    .map((part) => `${part.trim()}:not([data-color-scheme="light"])`)
    .join(", ");

  return tokensCss
    .replace(/^:host,\s*\n:root\s*\{/m, `${panelSelector} {`)
    .replace(
      /^:root\[data-color-scheme="dark"\],\s*\n:host\(\[data-color-scheme="dark"\]\)\s*\{/m,
      `${darkSelector} {`,
    )
    .replace(
      /@media \(prefers-color-scheme: dark\) \{\s*\n  :host:not\(\[data-color-scheme="light"\]\),\s*\n  :root:not\(\[data-color-scheme="light"\]\) \{/m,
      `@media (prefers-color-scheme: dark) {\n  ${prefersDarkSelector} {`,
    )
    .replace(/^html,\s*\nbody \{[\s\S]*?\}\s*\n/m, "")
    .replace(/^\[data-grip-mount\] \{[\s\S]*?\}\s*\n/m, "")
    .replace(/^#app \{[\s\S]*?\}\s*\n/m, "");
}
