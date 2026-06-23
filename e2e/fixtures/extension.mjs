import { test as base, chromium, expect } from "@playwright/test";
import { readE2EState } from "../global-setup.mjs";

export const TEST_PAGE_URL = "http://127.0.0.1:4173/";
export const TRAY_ID = "__grip_tray__";

function debugPort() {
  return readE2EState().port;
}

async function fetchTargets(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

const BUILTIN_EXTENSION_IDS = new Set([
  "fignfifoniblkonapihmkfakmlgkbkcf",
  "ghbmnnjooekpmoecnnnilnnbdlolhkhi",
]);

function pickExtensionId(targets) {
  for (const target of targets) {
    const match = target.url?.match(/^chrome-extension:\/\/([^/]+)\//);
    if (!match) continue;
    const id = match[1];
    if (BUILTIN_EXTENSION_IDS.has(id)) continue;
    return id;
  }
  return null;
}

async function resolveExtensionId(port) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const id = pickExtensionId(await fetchTargets(port));
    if (id) return id;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Could not resolve Grip extension id from Chrome debug targets");
}

export const test = base.extend({
  extensionBrowser: [
    async ({}, use) => {
      const port = debugPort();
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
      await use(browser);
      await browser.close();
    },
    { scope: "worker" },
  ],

  extensionContext: [
    async ({ extensionBrowser }, use) => {
      const context = extensionBrowser.contexts()[0];
      if (!context) throw new Error("No browser context from CDP connection");
      await use(context);
    },
    { scope: "worker" },
  ],

  extensionId: [
    async ({}, use) => {
      await use(await resolveExtensionId(debugPort()));
    },
    { scope: "worker" },
  ],
});

export { expect };

export function gripTrayToggle(page) {
  return page.locator(`#${TRAY_ID}`).locator(".grip-tray-toggle");
}

export async function gripShadowText(page) {
  return page.locator(`#${TRAY_ID}`).evaluate((host) => host.shadowRoot?.textContent ?? "");
}

export async function openFloatingPanel(page) {
  const toggle = gripTrayToggle(page);
  await expect(toggle).toBeVisible({ timeout: 20_000 });
  await toggle.click();
  await expect
    .poll(async () => gripShadowText(page), { timeout: 10_000 })
    .toContain("Pick");
}

export async function clickGripPickButton(page) {
  await page.locator(`#${TRAY_ID}`).evaluate((host) => {
    const buttons = host.shadowRoot?.querySelectorAll("button") ?? [];
    for (const btn of buttons) {
      if (btn.textContent?.includes("Pick")) {
        btn.click();
        return;
      }
    }
  });
}

export async function openPopup(context, extensionId) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
  return page;
}
