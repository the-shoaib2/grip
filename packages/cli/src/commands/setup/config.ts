import fs from "node:fs";
import path from "node:path";
import { binaryPath, getIDEPaths } from "./paths";

export function mergeMcpConfig(configPath: string, binPath: string, silent = false) {
  if (!silent) {
    console.log(`updating config: ${configPath}...`);
  }

  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Backup if exists
  if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, `${configPath}.bak`);
  }

  let config: any = {};
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf8").trim();
      if (raw) {
        config = JSON.parse(raw);
      }
    } catch (err: any) {
      console.error(`[error] failed to parse JSON in ${configPath}: ${err.message}`);
      return;
    }
  }

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  config.mcpServers["grip"] = {
    command: binPath,
    args: ["--port", "9222"],
    env: {
      GRIP_LOG_LEVEL: "info",
      GRIP_CHROME_PORT: "9222",
    },
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    if (!silent) {
      console.log(`[ok] updated: ${path.basename(configPath)}`);
    }
  } catch (err: any) {
    console.error(`[error] failed to write config: ${err.message}`);
  }
}

export function autoConfigureAll(silent = true) {
  const { cursorPath, claudePath, clinePath, antigravityPath } = getIDEPaths();
  const configured: string[] = [];

  // Always merge project-level Cursor config
  mergeMcpConfig(cursorPath, binaryPath, silent);
  configured.push("cursor");

  if (fs.existsSync(path.dirname(claudePath))) {
    mergeMcpConfig(claudePath, binaryPath, silent);
    configured.push("claude");
  }
  if (fs.existsSync(path.dirname(clinePath))) {
    mergeMcpConfig(clinePath, binaryPath, silent);
    configured.push("cline");
  }
  if (fs.existsSync(path.dirname(antigravityPath))) {
    mergeMcpConfig(antigravityPath, binaryPath, silent);
    configured.push("antigravity");
  }

  if (silent && configured.length > 0) {
    console.log(`[setup] configured integrations: ${configured.join(", ")}`);
  }
}
