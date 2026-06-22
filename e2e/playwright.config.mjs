import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.join(e2eDir, "specs"),
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: path.join(e2eDir, "global-setup.mjs"),
  globalTeardown: path.join(e2eDir, "global-teardown.mjs"),
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node serve.mjs",
    cwd: e2eDir,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
  projects: [
    {
      name: "chromium-extension",
      use: { browserName: "chromium" },
    },
  ],
});
