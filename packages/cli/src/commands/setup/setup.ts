import fs from "node:fs";
import readline from "node:readline";
import process from "node:process";
import { execSync } from "node:child_process";
import { getIDEPaths, binaryPath, repoRoot } from "./paths";
import { mergeMcpConfig } from "./config";

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

export async function setup() {
  console.log("=========================================");
  console.log("       Grip MCP Configurator Tool");
  console.log("=========================================");
  console.log(`Repository Root: ${repoRoot}`);
  console.log(`Binary Location: ${binaryPath}`);
  console.log("-----------------------------------------");

  if (!fs.existsSync(binaryPath)) {
    console.warn(`[warning] grip-mcp binary was not found at '${binaryPath}'.`);
    const buildAns = await askQuestion("Would you like to compile it now? (y/n): ");
    if (buildAns.toLowerCase() === "y") {
      console.log("Running compilation...");
      try {
        execSync("pnpm run build:mcp", { cwd: repoRoot, stdio: "inherit" });
      } catch (err: any) {
        console.error(`[error] build failed: ${err.message}`);
      }
    } else {
      console.log("Proceeding with configuration using the predicted path.");
    }
  }

  const { cursorPath, claudePath, clinePath, antigravityPath } = getIDEPaths();

  console.log("\nPlease select which IDEs or agents to configure:");
  console.log("1) Cursor IDE (project-level .cursor/mcp.json)");
  console.log("2) Claude Desktop (global configuration)");
  console.log("3) VS Code - Cline Extension");
  console.log("4) Antigravity IDE (Gemini Code Assist config)");
  console.log("5) All of the above");
  console.log("6) Exit");

  const option = await askQuestion("\nSelect option (1-6): ");

  switch (option) {
    case "1":
      mergeMcpConfig(cursorPath, binaryPath, false);
      break;
    case "2":
      mergeMcpConfig(claudePath, binaryPath, false);
      break;
    case "3":
      mergeMcpConfig(clinePath, binaryPath, false);
      break;
    case "4":
      mergeMcpConfig(antigravityPath, binaryPath, false);
      break;
    case "5":
      mergeMcpConfig(cursorPath, binaryPath, false);
      mergeMcpConfig(claudePath, binaryPath, false);
      mergeMcpConfig(clinePath, binaryPath, false);
      mergeMcpConfig(antigravityPath, binaryPath, false);
      break;
    case "6":
      console.log("Exiting configurator.");
      return;
    default:
      console.log("Invalid option, exiting.");
      return;
  }

  console.log("-----------------------------------------");
  console.log("Configuration complete!");
}
