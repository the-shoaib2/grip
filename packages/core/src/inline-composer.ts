/** Token embedded in stored comment text for inline element badges. */
export const GRIP_CHIP_TOKEN_RE = /\[\[grip:([a-zA-Z0-9_-]+)\]\]/g;

export function gripChipToken(chipId: string): string {
  return `[[grip:${chipId}]]`;
}

export function chipDisplayLabel(tag: string): string {
  const normalized = tag.toLowerCase().replace(/^<|>$/g, "");
  return `<${normalized}>`;
}

/** Element metadata stored on inline chips and copied to the clipboard. */
export interface ChipClipboardMeta {
  tag: string;
  role?: string;
  css?: string;
  text?: string;
  name?: string;
  xpath?: string;
  rect?: { top: number; left: number; width: number; height: number };
  shadowDOM?: boolean;
  iframe?: string;
  frameworkContext?: {
    framework: string;
    file?: string;
    line?: number;
    componentName?: string;
  } | null;
}

/** Format chip element metadata for clipboard (matches MCP prompt element block). */
export function formatChipForClipboard(meta: ChipClipboardMeta): string {
  const tag = chipDisplayLabel(meta.tag);
  const role = meta.role ?? meta.tag;
  const lines: string[] = [`Element: ${tag} · role: ${role}`];

  if (meta.text) lines.push(`Text: "${meta.text}"`);
  if (meta.css) lines.push(`CSS selector: ${meta.css}`);
  if (meta.xpath) lines.push(`XPath: ${meta.xpath}`);
  if (meta.rect) {
    lines.push(
      `Rect: { top: ${meta.rect.top}, left: ${meta.rect.left}, width: ${meta.rect.width}, height: ${meta.rect.height} }`,
    );
  }
  if (meta.name) lines.push(`A11y name: "${meta.name}"`);
  if (meta.shadowDOM !== undefined) {
    lines.push(`Shadow DOM: ${meta.shadowDOM ? "yes" : "no"}`);
  }
  if (meta.iframe) lines.push(`iframe: ${meta.iframe}`);
  const fw = meta.frameworkContext;
  if (fw?.file) {
    const loc = `${fw.file}${fw.line ? `:${fw.line}` : ""}`;
    lines.push(
      fw.componentName
        ? `Source: ${fw.componentName} (${fw.framework}) · ${loc}`
        : `Source: ${fw.framework} · ${loc}`,
    );
  }

  return lines.join("\n");
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

/** Replace ephemeral chip ids in a comment with stable stored pick ids. */
export function remapCommentChipIds(
  comment: string,
  mapping: Record<string, string>,
): string {
  return comment.replace(GRIP_CHIP_TOKEN_RE, (_, chipId: string) => {
    const nextId = mapping[chipId];
    return gripChipToken(nextId ?? chipId);
  });
}

/** Bind ephemeral picker chip ids to the stored pick id (single-chip saves). */
export function normalizePickCommentForStorage(
  comment: string | undefined,
  pickId: string,
): string | undefined {
  const trimmed = comment?.trim();
  if (!trimmed) return undefined;

  const chipIds = [
    ...trimmed.matchAll(GRIP_CHIP_TOKEN_RE),
  ].map((match) => match[1]!);

  if (chipIds.length === 1) {
    return trimmed.replace(GRIP_CHIP_TOKEN_RE, gripChipToken(pickId));
  }

  return trimmed;
}

export function newChipId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
