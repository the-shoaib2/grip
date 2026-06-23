import { mountFloatingGrip, TRAY_ID } from "@grip/devtools-floating";
import { playgroundRuntime } from "./mockRuntime";
import { getEffectiveColorScheme, getColorSchemePreference, syncGripTrayColorScheme } from "./theme";

function extensionTrayPresent(): boolean {
  return Boolean(document.getElementById(TRAY_ID));
}

function waitForExtensionTray(timeoutMs = 1500): Promise<boolean> {
  if (extensionTrayPresent()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!extensionTrayPresent()) return;
      observer.disconnect();
      resolve(true);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.setTimeout(() => {
      observer.disconnect();
      resolve(extensionTrayPresent());
    }, timeoutMs);
  });
}

void (async () => {
  if (await waitForExtensionTray()) return;

  const controller = mountFloatingGrip(playgroundRuntime);
  controller.setOpen(true);
  syncGripTrayColorScheme(getEffectiveColorScheme(getColorSchemePreference()));
})();
