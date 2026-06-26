import { GRIP_MCP_DEFAULT_PORT } from "../mcp-prompt.js";

export type GripMcpClientRootKey =
  | "mcpServers"
  | "servers"
  | "context_servers"
  | "mcp";

export interface GripMcpStdioConfigOptions {
  /** Path to grip-mcp binary or command name if on PATH */
  command: string;
  /** Extra CLI args (default includes --port) */
  args?: string[];
  port?: number;
  logLevel?: "debug" | "info" | "warn" | "error";
  /** Env overrides merged with GRIP_CHROME_PORT / GRIP_LOG_LEVEL */
  env?: Record<string, string>;
}

export interface GripMcpServerEntry {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/** Cursor / Claude Desktop / Windsurf style: `{ mcpServers: { grip: ... } }` */
export function createGripMcpStdioEntry(
  options: GripMcpStdioConfigOptions,
): GripMcpServerEntry {
  const port = options.port ?? GRIP_MCP_DEFAULT_PORT;
  const logLevel = options.logLevel ?? "info";
  return {
    command: options.command,
    args: options.args ?? ["--port", String(port)],
    env: {
      GRIP_CHROME_PORT: String(port),
      GRIP_LOG_LEVEL: logLevel,
      ...options.env,
    },
  };
}

/** Full JSON config object for a given MCP client root key. */
export function createGripMcpClientConfig(
  rootKey: GripMcpClientRootKey,
  options: GripMcpStdioConfigOptions,
): Record<string, unknown> {
  const entry = createGripMcpStdioEntry(options);

  switch (rootKey) {
    case "servers":
      return { servers: { grip: entry } };
    case "context_servers":
      return { context_servers: { grip: entry } };
    case "mcp":
      return {
        mcp: {
          grip: {
            type: "local",
            command: [entry.command, ...(entry.args ?? [])],
            enabled: true,
            environment: entry.env,
          },
        },
      };
    case "mcpServers":
    default:
      return { mcpServers: { grip: entry } };
  }
}

/** Pretty-printed JSON for pasting into client config files. */
export function formatGripMcpClientConfig(
  rootKey: GripMcpClientRootKey,
  options: GripMcpStdioConfigOptions,
  indent = 2,
): string {
  return JSON.stringify(createGripMcpClientConfig(rootKey, options), null, indent);
}

/** Cursor project config using ${workspaceFolder}/bin/grip-mcp */
export function createCursorGripMcpConfig(
  options: Partial<GripMcpStdioConfigOptions> = {},
): Record<string, unknown> {
  return createGripMcpClientConfig("mcpServers", {
    command: "${workspaceFolder}/bin/grip-mcp",
    ...options,
  });
}
