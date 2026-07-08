import fs from "node:fs";
import { getIDEPaths } from "./paths";

export async function showMcpDetails() {
  const { cursorPath, claudePath, clinePath, antigravityPath } = getIDEPaths();
  const configured: string[] = [];
  
  const checkConfig = (name: string, filePath: string) => {
    const exists = fs.existsSync(filePath);
    if (exists) {
      try {
        const raw = fs.readFileSync(filePath, "utf8").trim();
        if (raw) {
          const config = JSON.parse(raw);
          if (config.mcpServers && config.mcpServers["grip"]) {
            configured.push(name);
          }
        }
      } catch {}
    }
  };

  checkConfig("cursor", cursorPath);
  checkConfig("claude", claudePath);
  checkConfig("cline", clinePath);
  checkConfig("antigravity", antigravityPath);
  
  console.log("mcp server status:");
  const { statusDaemon } = await import("@/commands/daemon");
  await statusDaemon();
  
  console.log(`\nconfigured integrations: [${configured.join(", ")}]`);
}
