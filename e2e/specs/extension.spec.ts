import {
  expect,
  gripTrayToggle,
  openFloatingPanel,
  TEST_PAGE_URL,
  TRAY_ID,
  test,
} from "../fixtures/extension.mjs";

test.describe.configure({ mode: "serial" });

test.describe("Grip floating panel", () => {
  test("injects FAB on http pages", async ({ extensionContext }) => {
    const page = await extensionContext.newPage();
    await page.goto(TEST_PAGE_URL);
    await expect(gripTrayToggle(page)).toBeVisible({ timeout: 20_000 });
    await page.close();
  });

  test("opens full panel with Grip UI when FAB is clicked", async ({ extensionContext }) => {
    const page = await extensionContext.newPage();
    await page.goto(TEST_PAGE_URL);
    await openFloatingPanel(page);

    const text = await page.locator(`#${TRAY_ID}`).evaluate(
      (host) => host.shadowRoot?.textContent ?? "",
    );
    expect(text).toContain("Grip");
    expect(text).toContain("Pick");
    expect(text).toContain("No picks yet");
    expect(text).toContain("Console");
    await page.close();
  });

  test("FAB toggles panel open and closed", async ({ extensionContext }) => {
    const page = await extensionContext.newPage();
    await page.goto(TEST_PAGE_URL);
    const toggle = gripTrayToggle(page);
    await expect(toggle).toBeVisible({ timeout: 20_000 });

    await toggle.click();
    await expect
      .poll(async () =>
        page.locator(`#${TRAY_ID}`).evaluate((host) => host.shadowRoot?.textContent ?? ""),
      )
      .toContain("Pick");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await page.close();
  });
});

test.describe("Grip picker", () => {
  test("starts picker overlay from floating panel", async ({ extensionContext }) => {
    const page = await extensionContext.newPage();
    await page.goto(TEST_PAGE_URL);
    await openFloatingPanel(page);

    await page.locator(`#${TRAY_ID}`).evaluate((host) => {
      const btn = host.shadowRoot?.querySelector<HTMLButtonElement>(".grip-btn-primary");
      btn?.click();
    });

    await expect(page.locator("#__grip_picker_hover__")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await page.close();
  });

  test("can pick an element and save with prompt", async ({ extensionContext }) => {
    const page = await extensionContext.newPage();
    await page.goto(TEST_PAGE_URL);
    await openFloatingPanel(page);

    await page.locator(`#${TRAY_ID}`).evaluate((host) => {
      host.shadowRoot?.querySelector<HTMLButtonElement>(".grip-btn-primary")?.click();
    });

    await expect(page.locator("#__grip_picker_hover__")).toBeVisible({ timeout: 10_000 });
    await page.locator("#grip-target").click();
    await expect(page.locator("#__grip_picker_comment__")).toBeVisible({ timeout: 10_000 });

    const composer = page.locator("#__grip_picker_comment__ .grip-inline-editor");
    await composer.click();
    await composer.type("E2E pick target");

    await page.locator("#__grip_picker_comment__ button", { hasText: "Save" }).click();
    await expect(page.locator("#__grip_picker_comment__")).toBeHidden({ timeout: 10_000 });

    await openFloatingPanel(page);
    const panelText = await page.locator(`#${TRAY_ID}`).evaluate(
      (host) => host.shadowRoot?.textContent ?? "",
    );
    expect(panelText).toContain("button");
    expect(panelText).toContain("E2E pick target");
    await page.close();
  });
});
