import path from "node:path";
import os from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = process.env.GRIP_REPO_ROOT || path.resolve(__dirname, "../../../../");
export const binaryPath = process.env.GRIP_BINARY_PATH || path.join(repoRoot, "bin", "grip-mcp");

export function getIDEPaths() {
  const home = os.homedir();
  
  let claudePath = process.env.CLAUDE_CONFIG_PATH || path.join(home, "Library/Application Support/Claude/claude_desktop_config.json");
  let clinePath = process.env.CLINE_CONFIG_PATH || path.join(home, "Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json");
  let antigravityPath = process.env.ANTIGRAVITY_CONFIG_PATH || path.join(home, ".gemini/antigravity-ide/mcp_config.json");

  if (!process.env.CLAUDE_CONFIG_PATH || !process.env.CLINE_CONFIG_PATH) {
    if (process.platform === "win32") {
      const appData = process.env.APPDATA || path.join(home, "AppData/Roaming");
      if (!process.env.CLAUDE_CONFIG_PATH) {
        claudePath = path.join(appData, "Claude/claude_desktop_config.json");
      }
      if (!process.env.CLINE_CONFIG_PATH) {
        clinePath = path.join(appData, "Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json");
      }
    } else if (process.platform === "linux") {
      const config = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
      if (!process.env.CLAUDE_CONFIG_PATH) {
        claudePath = path.join(config, "Claude/claude_desktop_config.json");
      }
      if (!process.env.CLINE_CONFIG_PATH) {
        clinePath = path.join(config, "Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json");
      }
    }
  }

  const cursorPath = process.env.CURSOR_CONFIG_PATH || path.join(process.cwd(), ".cursor/mcp.json");

  return { cursorPath, claudePath, clinePath, antigravityPath };
}
