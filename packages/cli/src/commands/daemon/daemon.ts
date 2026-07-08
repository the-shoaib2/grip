import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { execSync, spawn } from "node:child_process";
import { autoConfigureAll, binaryPath, repoRoot } from "../setup";

export const gripDir = process.env.GRIP_DIR || path.join(os.homedir(), ".grip");
export const pidFile = process.env.GRIP_PID_FILE || path.join(gripDir, "grip-mcp.pid");
export const logFile = process.env.GRIP_LOG_FILE || path.join(gripDir, "grip-mcp.log");

function ensureGripDir() {
  if (!fs.existsSync(gripDir)) {
    fs.mkdirSync(gripDir, { recursive: true });
  }
}

function isPidRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    return err.code === "EPERM";
  }
}

export async function startDaemon() {
  ensureGripDir();

  // 1. Check if already running
  if (fs.existsSync(pidFile)) {
    const pidText = fs.readFileSync(pidFile, "utf8").trim();
    const pid = parseInt(pidText, 10);
    if (!isNaN(pid) && isPidRunning(pid)) {
      console.log(`[info] server already running (pid: ${pid}).`);
      return;
    }
  }

  // 2. Auto-configure all IDEs
  console.log("[setup] configuring ide integrations...");
  autoConfigureAll();

  // 3. Check for binary
  if (!fs.existsSync(binaryPath)) {
    console.warn("[warning] grip-mcp binary not found. building Go server...");
    try {
      execSync("pnpm run build:mcp", { cwd: repoRoot, stdio: "inherit" });
    } catch (err: any) {
      console.error(`[error] build failed: ${err.message}`);
      process.exit(1);
    }
  }

  // 4. Start process in the background
  const out = fs.openSync(logFile, "a");
  const err = fs.openSync(logFile, "a");

  console.log("[start] starting background mcp server...");
  const child = spawn(binaryPath, ["--port", "9222", "--background"], {
    detached: true,
    stdio: ["ignore", out, err],
    cwd: repoRoot,
  });

  if (child.pid) {
    fs.writeFileSync(pidFile, child.pid.toString(), "utf8");
    console.log(`\n[ok] server started`);
    console.log(`  pid: ${child.pid}`);
    console.log(`  logs: ${logFile}`);
    console.log(`  bridge port: 9223`);
  } else {
    console.error("[error] failed to start background process.");
  }

  child.unref();
}

export async function stopDaemon() {
  ensureGripDir();

  if (!fs.existsSync(pidFile)) {
    console.log("[info] server not running.");
    return;
  }

  const pidText = fs.readFileSync(pidFile, "utf8").trim();
  const pid = parseInt(pidText, 10);

  if (isNaN(pid) || !isPidRunning(pid)) {
    console.log("[info] server not running (cleaned stale pid file).");
    fs.unlinkSync(pidFile);
    return;
  }

  console.log(`[stop] stopping server (pid: ${pid})...`);
  try {
    process.kill(pid, "SIGTERM");

    // Wait up to 2 seconds for process to exit
    let killed = false;
    for (let i = 0; i < 20; i++) {
      if (!isPidRunning(pid)) {
        killed = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!killed) {
      console.log("[warning] process did not exit. force terminating...");
      process.kill(pid, "SIGKILL");
    }

    console.log("[ok] server stopped.");
  } catch (err: any) {
    console.error(`[error] failed to stop process: ${err.message}`);
  }

  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile);
  }
}

export async function statusDaemon() {
  ensureGripDir();

  if (!fs.existsSync(pidFile)) {
    console.log("status: stopped");
    console.log("  To start the server, run: grip start (or /start in this shell)");
    return;
  }

  const pidText = fs.readFileSync(pidFile, "utf8").trim();
  const pid = parseInt(pidText, 10);

  if (isNaN(pid) || !isPidRunning(pid)) {
    console.log("status: stopped (stale pid file found)");
    console.log("  To start the server, run: grip start (or /start in this shell)");
    return;
  }

  console.log("status: running");
  console.log(`  pid: ${pid}`);
  console.log(`  bridge port: 9223`);
  console.log(`  chrome port: 9222`);
  console.log(`  logs: ${logFile}`);
}
