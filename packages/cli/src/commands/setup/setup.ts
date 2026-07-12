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

export async function setup(args: string[] = []) {
  console.log("=========================================");
  console.log("       Grip MCP Configurator Tool");
  console.log("=========================================");
  console.log(`Repository Root: ${repoRoot}`);
  console.log(`Binary Location: ${binaryPath}`);
  console.log("-----------------------------------------");

  let selectedOption: string | null = null;
  let silent = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--cursor") selectedOption = "1";
    else if (arg === "--claude") selectedOption = "2";
    else if (arg === "--cline") selectedOption = "3";
    else if (arg === "--antigravity") selectedOption = "4";
    else if (arg === "--all") selectedOption = "5";
    else if (arg === "--silent") silent = true;
    else if (arg === "--ide" && i + 1 < args.length) {
      const ide = args[++i].toLowerCase();
      if (ide === "cursor") selectedOption = "1";
      else if (ide === "claude") selectedOption = "2";
      else if (ide === "cline") selectedOption = "3";
      else if (ide === "antigravity") selectedOption = "4";
      else if (ide === "all") selectedOption = "5";
    }
  }

  if (!fs.existsSync(binaryPath) && !silent) {
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

  if (selectedOption === null) {
    console.log("\nPlease select which IDEs or agents to configure:");
    console.log("1) Cursor IDE (project-level .cursor/mcp.json)");
    console.log("2) Claude Desktop (global configuration)");
    console.log("3) VS Code - Cline Extension");
    console.log("4) Antigravity IDE (Gemini Code Assist config)");
    console.log("5) All of the above");
    console.log("6) Exit");

    selectedOption = await askQuestion("\nSelect option (1-6): ");
  }

  switch (selectedOption) {
    case "1":
      mergeMcpConfig(cursorPath, binaryPath, silent);
      break;
    case "2":
      mergeMcpConfig(claudePath, binaryPath, silent);
      break;
    case "3":
      mergeMcpConfig(clinePath, binaryPath, silent);
      break;
    case "4":
      mergeMcpConfig(antigravityPath, binaryPath, silent);
      break;
    case "5":
      mergeMcpConfig(cursorPath, binaryPath, silent);
      mergeMcpConfig(claudePath, binaryPath, silent);
      mergeMcpConfig(clinePath, binaryPath, silent);
      mergeMcpConfig(antigravityPath, binaryPath, silent);
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
