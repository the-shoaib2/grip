/** Tool names registered by grip-mcp (packages/mcp-server). Keep in sync with internal/tools/register.go */
export const GRIP_MCP_TOOLS = [
  "snapshot",
  "highlight",
  "click",
  "fill",
  "read_logs",
  "read_network",
  "screenshot",
  "pick_element",
  "navigate",
  "eval",
] as const;

export type GripMcpToolName = (typeof GRIP_MCP_TOOLS)[number];

/** Suggested agent workflow after a human pick (matches formatMcpPrompt footer). */
export const GRIP_MCP_WORKFLOW = [
  "snapshot() — get accessibility tree + refs on this page",
  "highlight(ref) before click(ref) or fill(ref, value)",
  "read_logs() after each action",
] as const;
