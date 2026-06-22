/** Token embedded in stored comment text for inline element badges. */
export const GRIP_CHIP_TOKEN_RE = /\[\[grip:([a-zA-Z0-9_-]+)\]\]/g;

export function gripChipToken(chipId: string): string {
  return `[[grip:${chipId}]]`;
}

export function chipDisplayLabel(tag: string): string {
  const normalized = tag.toLowerCase().replace(/^<|>$/g, "");
  return `<${normalized}>`;
}

/** Serialize interleaved text + chip tokens. */
export function serializeInlineComment(
  parts: Array<{ type: "text"; value: string } | { type: "chip"; id: string }>,
): string {
  return parts
    .map((part) =>
      part.type === "text" ? part.value : gripChipToken(part.id),
    )
    .join("");
}

/** Parse stored comment into text segments and chip ids. */
export function parseInlineComment(
  value: string,
): Array<{ type: "text"; value: string } | { type: "chip"; id: string }> {
  if (!value) return [];

  const parts: Array<
    { type: "text"; value: string } | { type: "chip"; id: string }
  > = [];
  let lastIndex = 0;

  for (const match of value.matchAll(GRIP_CHIP_TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: value.slice(lastIndex, index) });
    }
    parts.push({ type: "chip", id: match[1]! });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < value.length) {
    parts.push({ type: "text", value: value.slice(lastIndex) });
  }

  return parts;
}

/** Human-readable comment for MCP (tokens → `<tag>` labels). */
export function formatInlineCommentForMcp(
  value: string,
  tagsById: Record<string, string>,
): string {
  return value.replace(GRIP_CHIP_TOKEN_RE, (_, id: string) => {
    const tag = tagsById[id];
    return tag ? chipDisplayLabel(tag) : gripChipToken(id);
  });
}

export function newChipId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
