import { describe, expect, it } from "vitest";
import {
  createCursorGripMcpConfig,
  createGripMcpClientConfig,
  formatGripMcpClientConfig,
} from "./config.js";
import { GRIP_MCP_TOOLS } from "./tools.js";

describe("createGripMcpClientConfig", () => {
  it("builds mcpServers config with port env and args", () => {
    const cfg = createGripMcpClientConfig("mcpServers", {
      command: "/bin/grip-mcp",
      port: 9222,
    }) as { mcpServers: { grip: { command: string; args: string[]; env: Record<string, string> } } };

    expect(cfg.mcpServers.grip.command).toBe("/bin/grip-mcp");
    expect(cfg.mcpServers.grip.args).toEqual(["--port", "9222"]);
    expect(cfg.mcpServers.grip.env.GRIP_CHROME_PORT).toBe("9222");
    expect(cfg.mcpServers.grip.env.GRIP_LOG_LEVEL).toBe("info");
  });

  it("builds OpenCode mcp root with command array", () => {
    const cfg = createGripMcpClientConfig("mcp", {
      command: "/bin/grip-mcp",
    }) as {
      mcp: {
        grip: { type: string; command: string[]; environment: Record<string, string> };
      };
    };

    expect(cfg.mcp.grip.type).toBe("local");
    expect(cfg.mcp.grip.command).toEqual(["/bin/grip-mcp", "--port", "9222"]);
    expect(cfg.mcp.grip.environment.GRIP_CHROME_PORT).toBe("9222");
  });

  it("formats Cursor workspace config", () => {
    const cfg = createCursorGripMcpConfig();
    const json = formatGripMcpClientConfig("mcpServers", {
      command: "${workspaceFolder}/bin/grip-mcp",
    });
    expect(json).toContain("mcpServers");
    expect(cfg.mcpServers).toBeDefined();
  });
});

describe("GRIP_MCP_TOOLS", () => {
  it("lists ten server tools", () => {
    expect(GRIP_MCP_TOOLS).toHaveLength(10);
    expect(GRIP_MCP_TOOLS).toContain("snapshot");
    expect(GRIP_MCP_TOOLS).toContain("pick_element");
  });
});
