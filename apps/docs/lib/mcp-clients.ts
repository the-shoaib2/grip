export type McpClientCategory = "ide" | "cli";

export interface McpClientGuide {
  id: string;
  name: string;
  category: McpClientCategory;
  configPaths: string[];
  rootKey?: string;
  notes?: string[];
  docsUrl?: string;
  config: string;
}

const GRIP_BIN = "/path/to/grip/bin/grip-mcp";

const gripStdio = (rootKey = "mcpServers", indent = 2) => {
  const pad = " ".repeat(indent);
  const inner = `${pad}"grip": {
${pad}  "command": "${GRIP_BIN}",
${pad}  "env": {
${pad}    "GRIP_CHROME_PORT": "9222",
${pad}    "GRIP_LOG_LEVEL": "info"
${pad}  }
${pad}}`;
  if (rootKey === "servers") {
    return `{
  "servers": {
${inner}
  }
}`;
  }
  if (rootKey === "context_servers") {
    return `{
  "context_servers": {
${inner}
  }
}`;
  }
  if (rootKey === "mcp") {
    return `{
  "mcp": {
    "grip": {
      "type": "local",
      "command": ["${GRIP_BIN}"],
      "enabled": true,
      "environment": {
        "GRIP_CHROME_PORT": "9222",
        "GRIP_LOG_LEVEL": "info"
      }
    }
  }
}`;
  }
  return `{
  "mcpServers": {
${inner}
  }
}`;
};

export const gripMcpReference = gripStdio();

export const mcpClientGuides: McpClientGuide[] = [
  {
    id: "cursor",
    name: "Cursor",
    category: "ide",
    configPaths: [".cursor/mcp.json (project)", "~/.cursor/mcp.json (user)"],
    rootKey: "mcpServers",
    docsUrl: "https://cursor.com/docs/context/mcp",
    notes: ["Supports ${workspaceFolder} in command paths."],
    config: `{
  "mcpServers": {
    "grip": {
      "command": "\${workspaceFolder}/bin/grip-mcp",
      "env": {
        "GRIP_CHROME_PORT": "9222",
        "GRIP_LOG_LEVEL": "info"
      }
    }
  }
}`,
  },
  {
    id: "vscode",
    name: "VS Code (GitHub Copilot)",
    category: "ide",
    configPaths: [".vscode/mcp.json (workspace)", "User MCP config via MCP: Open User Configuration"],
    rootKey: "servers",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
    notes: ["Uses servers — not mcpServers — as the root key."],
    config: gripStdio("servers"),
  },
  {
    id: "windsurf",
    name: "Windsurf (Codeium Cascade)",
    category: "ide",
    configPaths: ["~/.codeium/windsurf/mcp_config.json (global only)"],
    rootKey: "mcpServers",
    docsUrl: "https://docs.windsurf.com/windsurf/cascade/mcp",
    config: gripStdio(),
  },
  {
    id: "zed",
    name: "Zed",
    category: "ide",
    configPaths: ["~/.config/zed/settings.json", ".zed/settings.json (project, optional)"],
    rootKey: "context_servers",
    docsUrl: "https://zed.dev/docs/ai/mcp",
    notes: ["Uses context_servers in settings.json — not mcpServers."],
    config: gripStdio("context_servers"),
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    category: "ide",
    configPaths: [
      "~/Library/Application Support/Claude/claude_desktop_config.json (macOS)",
      "%APPDATA%\\Claude\\claude_desktop_config.json (Windows)",
      "~/.config/Claude/claude_desktop_config.json (Linux)",
    ],
    rootKey: "mcpServers",
    docsUrl: "https://modelcontextprotocol.io/docs/develop/connect-local-servers",
    config: gripStdio(),
  },
  {
    id: "jetbrains",
    name: "JetBrains AI Assistant",
    category: "ide",
    configPaths: ["Settings → Tools → AI Assistant → MCP (per-IDE UI)"],
    rootKey: "mcpServers",
    docsUrl: "https://www.jetbrains.com/help/ai-assistant/mcp.html",
    notes: ["Configure via IDE settings UI; paste the same command and env values."],
    config: gripStdio(),
  },
  {
    id: "antigravity",
    name: "Google Antigravity",
    category: "ide",
    configPaths: ["~/.gemini/antigravity/mcp_config.json (global)"],
    rootKey: "mcpServers",
    notes: ["Google's agentic IDE; MCP config format matches other mcpServers clients."],
    config: gripStdio(),
  },
  {
    id: "claude-code",
    name: "Claude Code",
    category: "cli",
    configPaths: [
      ".mcp.json (project root)",
      ".claude/settings.json (project)",
      "~/.claude/settings.json (user)",
    ],
    rootKey: "mcpServers",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp",
    notes: [
      "CLI: claude mcp add grip -- /path/to/grip/bin/grip-mcp",
      "Set GRIP_CHROME_PORT via env in settings or export before running.",
    ],
    config: gripStdio(),
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    category: "cli",
    configPaths: ["~/.gemini/settings.json"],
    rootKey: "mcpServers",
    docsUrl: "https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md",
    config: gripStdio(),
  },
  {
    id: "opencode",
    name: "OpenCode",
    category: "cli",
    configPaths: ["opencode.json (project)", "~/.config/opencode/opencode.json (global)"],
    rootKey: "mcp",
    docsUrl: "https://opencode.ai/docs/mcp-servers",
    notes: ["Uses mcp root key, type: local, command as array, environment instead of env."],
    config: gripStdio("mcp"),
  },
  {
    id: "codex",
    name: "OpenAI Codex CLI",
    category: "cli",
    configPaths: ["~/.codex/config.toml", "Project .codex/config.toml"],
    rootKey: "mcp_servers",
    docsUrl: "https://developers.openai.com/codex/mcp/",
    notes: ["TOML format — add an [mcp_servers.grip] section with command and env."],
    config: `[mcp_servers.grip]
command = "${GRIP_BIN}"
env = { GRIP_CHROME_PORT = "9222", GRIP_LOG_LEVEL = "info" }`,
  },
  {
    id: "cline",
    name: "Cline (VS Code extension)",
    category: "cli",
    configPaths: ["Cline MCP settings in VS Code", "Or shared .vscode/mcp.json with Copilot"],
    rootKey: "mcpServers",
    docsUrl: "https://docs.cline.bot/mcp/configuring-mcp-servers",
    notes: ["Configure through Cline's MCP Servers UI or project MCP JSON."],
    config: gripStdio(),
  },
  {
    id: "continue",
    name: "Continue",
    category: "cli",
    configPaths: ["~/.continue/config.yaml", ".continue/config.yaml (project)"],
    rootKey: "mcpServers",
    docsUrl: "https://docs.continue.dev/customize/deep-dives/mcp",
    notes: ["YAML config — mcpServers block with command and env."],
    config: `mcpServers:
  - name: grip
    command: ${GRIP_BIN}
    env:
      GRIP_CHROME_PORT: "9222"
      GRIP_LOG_LEVEL: info`,
  },
  {
    id: "amazon-q",
    name: "Amazon Q Developer",
    category: "cli",
    configPaths: ["~/.aws/amazonq/mcp.json", "Project mcp.json"],
    rootKey: "mcpServers",
    docsUrl: "https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/mcp.html",
    config: gripStdio(),
  },
  {
    id: "mcpjam",
    name: "MCPJam",
    category: "cli",
    configPaths: ["MCPJam app → server registry (stdio)"],
    rootKey: "mcpServers",
    docsUrl: "https://docs.mcpjam.com/",
    notes: ["Use MCPJam to inspect and test grip-mcp before wiring into your IDE."],
    config: gripStdio(),
  },
];

export const mcpIdeClients = mcpClientGuides.filter((c) => c.category === "ide");
export const mcpCliClients = mcpClientGuides.filter((c) => c.category === "cli");
