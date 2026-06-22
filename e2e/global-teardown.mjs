import { readFileSync, unlinkSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default async function globalTeardown() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const stateFile = path.join(root, ".e2e-chrome.json");

  try {
    const { pid, port } = JSON.parse(readFileSync(stateFile, "utf8"));
    if (pid) {
      try {
        process.kill(-pid, "SIGTERM");
      } catch {
        try {
          process.kill(pid, "SIGTERM");
        } catch {
          /* already stopped */
        }
      }
    }
    if (port) {
      rmSync(`/tmp/grip-e2e-chrome-${port}`, { recursive: true, force: true });
    }
    unlinkSync(stateFile);
  } catch {
    /* no state file */
  }
}
