import { execSync, spawn } from "node:child_process";
import { readFileSync, rmSync, writeFileSync, unlinkSync } from "node:fs";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionPath = path.join(root, "packages/extension/dist");
const stateFile = path.join(root, ".e2e-chrome.json");
const debugPort = Number(process.env.E2E_CHROME_PORT ?? 9333);
const userDataDir = `/tmp/grip-e2e-chrome-${debugPort}`;

const BUILTIN_EXTENSION_IDS = new Set([
  "fignfifoniblkonapihmkfakmlgkbkcf",
  "ghbmnnjooekpmoecnnnilnnbdlolhkhi",
]);

function chromeExecutable() {
  for (const bin of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try {
      return execSync(`command -v ${bin}`, { encoding: "utf8" }).trim();
    } catch {
      /* try next */
    }
  }
  // macOS application bundles
  const macPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const p of macPaths) {
    try {
      execSync(`test -x "${p}"`);
      return p;
    } catch {
      /* try next */
    }
  }
  throw new Error("Chrome/Chromium not found for e2e tests");
}

function waitForPort(port, timeoutMs = 30_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = createConnection({ port, host: "127.0.0.1" });
      socket.once("connect", () => {
        socket.end();
        resolve(undefined);
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for Chrome on port ${port}`));
          return;
        }
        setTimeout(tryConnect, 250);
      });
    };
    tryConnect();
  });
}

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

export default async function globalSetup() {
  execSync("pnpm build --filter @grip/extension", {
    cwd: root,
    stdio: "inherit",
  });

  try {
    unlinkSync(stateFile);
  } catch {
    /* fresh run */
  }

  rmSync(userDataDir, { recursive: true, force: true });

  const chrome = spawn(
    chromeExecutable(),
    [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "about:blank",
    ],
    {
      detached: true,
      stdio: "ignore",
    },
  );
  chrome.unref();

  writeFileSync(
    stateFile,
    JSON.stringify({ port: debugPort, pid: chrome.pid, extensionPath }, null, 2),
  );

  await waitForPort(debugPort);

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const targets = response.ok ? await response.json() : [];
      if (pickExtensionId(targets)) return;
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Grip extension did not register with Chrome during e2e global setup");
}

export function readE2EState() {
  return JSON.parse(readFileSync(stateFile, "utf8"));
}
