export type DocCodeLang = "bash" | "json" | "toml" | "yaml" | "text";

export function detectCodeLang(code: string): DocCodeLang {
  const trimmed = code.trim();

  if (trimmed.startsWith("mcpServers:") || /^\s*-\s+name:/m.test(trimmed)) {
    return "yaml";
  }
  if (trimmed.startsWith("[") && trimmed.includes("=")) {
    return "toml";
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("pnpm") ||
    trimmed.startsWith("git") ||
    trimmed.includes("GRIP_")
  ) {
    return "bash";
  }
  return "text";
}
