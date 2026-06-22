import type { McpClientGuide } from "@lib/mcp-clients";

const SIMPLE_ICONS = "https://cdn.jsdelivr.net/npm/simple-icons@14.15.0/icons";

function favicon(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function simpleIcon(slug: string): string {
  return `${SIMPLE_ICONS}/${slug}.svg`;
}

/** Per-client icon source — Simple Icons (mono) or favicon (color) */
const iconByClient: Record<string, { url: string; mono: boolean }> = {
  cursor: { url: favicon("cursor.com"), mono: false },
  vscode: { url: favicon("code.visualstudio.com"), mono: false },
  windsurf: { url: simpleIcon("windsurf"), mono: true },
  zed: { url: simpleIcon("zedindustries"), mono: true },
  "claude-desktop": { url: simpleIcon("anthropic"), mono: true },
  jetbrains: { url: simpleIcon("jetbrains"), mono: true },
  antigravity: { url: favicon("antigravity.google"), mono: false },
  "claude-code": { url: simpleIcon("anthropic"), mono: true },
  "gemini-cli": { url: simpleIcon("googlegemini"), mono: true },
  opencode: { url: favicon("opencode.ai"), mono: false },
  codex: { url: simpleIcon("openai"), mono: true },
  cline: { url: favicon("cline.bot"), mono: false },
  continue: { url: favicon("continue.dev"), mono: false },
  "amazon-q": { url: simpleIcon("amazonwebservices"), mono: true },
  mcpjam: { url: favicon("mcpjam.com"), mono: false },
};

export function getMcpClientIconUrl(client: McpClientGuide): string {
  return iconByClient[client.id]?.url ?? favicon("modelcontextprotocol.io");
}

export function usesSimpleIcon(client: McpClientGuide): boolean {
  return iconByClient[client.id]?.mono ?? false;
}
