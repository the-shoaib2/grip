/** Playground-only color scheme controls (localhost:5174 demo). */

export type ColorSchemePreference = "light" | "dark" | "system";
export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "grip-playground-color-scheme";

export function getColorSchemePreference(): ColorSchemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function getSystemColorScheme(): ColorScheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getEffectiveColorScheme(
  preference: ColorSchemePreference = getColorSchemePreference(),
): ColorScheme {
  return preference === "system" ? getSystemColorScheme() : preference;
}

export function syncGripTrayColorScheme(scheme: ColorScheme) {
  document.getElementById("__grip_tray__")?.setAttribute("data-color-scheme", scheme);
}

export function applyColorSchemePreference(preference: ColorSchemePreference) {
  localStorage.setItem(STORAGE_KEY, preference);
  const effective = getEffectiveColorScheme(preference);

  document.documentElement.setAttribute("data-color-scheme", effective);
  document.documentElement.dataset.colorSchemePref = preference;
  syncGripTrayColorScheme(effective);

  document.querySelectorAll<HTMLButtonElement>("[data-pg-theme]").forEach((button) => {
    const active = button.dataset.pgTheme === preference;
    button.classList.toggle("pg-theme-btn-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

export function initPlaygroundColorScheme() {
  applyColorSchemePreference(getColorSchemePreference());

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (getColorSchemePreference() === "system") {
        applyColorSchemePreference("system");
      }
    });
}
