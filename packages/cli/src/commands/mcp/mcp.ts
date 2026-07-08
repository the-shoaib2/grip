import fs from "node:fs";
import process from "node:process";
import { spawn, execSync } from "node:child_process";
import { binaryPath, repoRoot } from "../setup";

export async function mcp(args: string[]) {
  // Check if binary is compiled, if not compile it
  if (!fs.existsSync(binaryPath)) {
    console.warn("⚠️  grip-mcp binary not found. Building Go MCP server now...");
    try {
      execSync("pnpm run build:mcp", { cwd: repoRoot, stdio: "inherit" });
    } catch (err: any) {
      console.error(`❌ Build failed: ${err.message}`);
      process.exit(1);
    }
  }

  // Spawn Go MCP server
  const child = spawn(binaryPath, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (err) => {
    console.error("❌ Failed to start Go MCP server:", err);
    process.exit(1);
  });
}
