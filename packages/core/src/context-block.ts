import { formatMcpPrompt, formatAllMcpPrompts } from "./mcp-prompt.js";
import { parseInlineComment } from "./inline-composer.js";
import { readSourceSnippet } from "./source-mapper/read-snippet.js";
import { normalizeSourcePath } from "./source-mapper/normalize-path.js";
import type { FrameworkContext } from "./types/framework.js";
import type { StoredPick } from "./types/messages.js";

export interface ContextBlockFramework {
  name: string;
  metadata?: Record<string, string>;
}

export interface ContextBlock {
  componentName: string;
  filePath: string;
  lineRange: { start: number; end: number };
  sourceCode: string;
  framework: ContextBlockFramework;
  instructions: string[];
}

export interface BuildContextBlockOptions {
  workspaceRoot?: string;
  fetchSource?: boolean;
  instructions?: string[];
}

/** Parse user comment text into ordered instruction bullets. */
export function parseInstructions(comment?: string): string[] {
  if (!comment?.trim()) return [];

  const withoutChips = comment.replace(/\[\[grip:[a-zA-Z0-9_-]+\]\]/g, " ").trim();
  if (!withoutChips) return [];

  const lines = withoutChips
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const single = lines[0] ?? "";
  if (single.includes(";")) {
    return single.split(";").map((part) => part.trim()).filter(Boolean);
  }

  return [single];
}

export function componentNameFromPick(
  pick: {
    tagName?: string;
    tag?: string;
    label?: string;
    frameworkContext?: FrameworkContext | null;
  },
): string {
  const fw = pick.frameworkContext;
  if (fw?.componentName) return fw.componentName;
  if ("label" in pick && pick.label) return pick.label;
  const tag = ("tagName" in pick ? pick.tagName : pick.tag) ?? "element";
  return tag;
}

export function canBuildContextBlock(
  pick: { frameworkContext?: FrameworkContext | null },
): boolean {
  return Boolean(pick.frameworkContext?.file);
}

/** Build a Context Block from a stored pick (source optional until enriched). */
export function buildContextBlockFromPick(
  pick: StoredPick,
  options?: BuildContextBlockOptions,
): ContextBlock | null {
  const fw = pick.frameworkContext;
  if (!fw?.file) return null;

  const filePath = normalizeSourcePath(fw.file, options?.workspaceRoot);
  const line = fw.line ?? 1;
  const instructions =
    options?.instructions ?? parseInstructions(pick.comment);

  return {
    componentName: componentNameFromPick(pick),
    filePath,
    lineRange: { start: line, end: line },
    sourceCode: "",
    framework: {
      name: fw.framework,
      metadata: fw.file ? { file: fw.file } : undefined,
    },
    instructions,
  };
}

/** Attach source code from disk when running in a host environment. */
export async function enrichContextBlock(
  block: ContextBlock,
  options?: { workspaceRoot?: string },
): Promise<ContextBlock> {
  if (!block.filePath) return block;

  try {
    const snippet = await readSourceSnippet({
      filePath: block.filePath,
      line: block.lineRange.start,
      workspaceRoot: options?.workspaceRoot,
    });
    return {
      ...block,
      filePath: snippet.filePath,
      lineRange: snippet.lineRange,
      sourceCode: snippet.sourceCode,
    };
  } catch {
    return block;
  }
}

/** Build independent Context Blocks for each chip token in a session comment. */
export function buildContextBlocksFromSession(
  pick: StoredPick,
  sessionPicks: StoredPick[] = [],
  options?: BuildContextBlockOptions,
): ContextBlock[] {
  const comment = pick.comment ?? "";
  const parts = parseInlineComment(comment);
  const chipIds = parts
    .filter((part): part is { type: "chip"; id: string } => part.type === "chip")
    .map((part) => part.id);

  const lookup = new Map(sessionPicks.map((p) => [p.id, p]));
  const instructionText = parts
    .filter((part): part is { type: "text"; value: string } => part.type === "text")
    .map((part) => part.value)
    .join("")
    .trim();
  const sharedInstructions = parseInstructions(instructionText);

  const targets =
    chipIds.length > 0
      ? chipIds.map((id) => lookup.get(id) ?? pick)
      : [pick];

  const blocks: ContextBlock[] = [];
  for (const target of targets) {
    const block = buildContextBlockFromPick(target, {
      ...options,
      instructions: sharedInstructions.length ? sharedInstructions : parseInstructions(target.comment),
    });
    if (block) blocks.push(block);
  }
  return blocks;
}

/** Format Context Blocks for the Context Engine agent prompt. */
export function formatContextEnginePrompt(blocks: ContextBlock[]): string {
  if (!blocks.length) return "";

  return blocks
    .map((block) => {
      const lines: string[] = [
        "CONTEXT:",
        `Component: ${block.componentName}`,
        `File: ${block.filePath}`,
        `Lines: ${block.lineRange.start}-${block.lineRange.end}`,
        "",
        block.sourceCode || "(source unavailable — call resolve_context_block to attach)",
        "",
        "INSTRUCTIONS:",
      ];

      if (block.instructions.length) {
        for (const instruction of block.instructions) {
          lines.push(`* ${instruction}`);
        }
      } else {
        lines.push("* (no instructions provided)");
      }

      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

/** Prefer Context Engine format when blocks are available; otherwise DOM MCP prompt. */
export function formatPickPrompt(
  pick: StoredPick,
  options?: {
    sessionPicks?: StoredPick[];
    workspaceRoot?: string;
    mode?: "auto" | "context" | "dom";
  },
): string {
  const mode = options?.mode ?? "auto";
  const blocks = buildContextBlocksFromSession(pick, options?.sessionPicks ?? []);

  if (mode === "context" || (mode === "auto" && blocks.length > 0)) {
    return formatContextEnginePrompt(blocks);
  }

  return formatMcpPrompt({ ...pick, comment: pick.comment });
}

export async function formatEnrichedContextEnginePrompt(
  pick: StoredPick,
  options?: {
    sessionPicks?: StoredPick[];
    workspaceRoot?: string;
  },
): Promise<string> {
  const blocks = buildContextBlocksFromSession(pick, options?.sessionPicks ?? [], {
    workspaceRoot: options?.workspaceRoot,
  });

  if (!blocks.length) {
    const { formatMcpPrompt } = await import("./mcp-prompt.js");
    return formatMcpPrompt({ ...pick, comment: pick.comment });
  }

  const enriched: ContextBlock[] = [];
  for (const block of blocks) {
    enriched.push(await enrichContextBlock(block, { workspaceRoot: options?.workspaceRoot }));
  }
  return formatContextEnginePrompt(enriched);
}

export function formatAllContextEnginePrompts(
  picks: StoredPick[],
  options?: { sessionId?: string; workspaceRoot?: string },
): string {
  if (!picks.length) return "";

  const blocks = picks.flatMap((pick) =>
    buildContextBlocksFromSession(pick, picks, { workspaceRoot: options?.workspaceRoot }),
  );

  if (!blocks.length) {
    return formatAllMcpPrompts(picks, { sessionId: options?.sessionId });
  }

  const sessionRef = options?.sessionId?.trim();
  const header = sessionRef
    ? `## Grip Context Engine · session \`${sessionRef}\` · ${blocks.length} block(s)\n\n`
    : `## Grip Context Engine · ${blocks.length} block(s)\n\n`;

  return header + formatContextEnginePrompt(blocks);
}

/** Clipboard payload for Send to agent — includes session JSON footer for MCP handshake. */
export function formatSendToAgentPrompt(
  picks: StoredPick[],
  options?: { sessionId?: string; workspaceRoot?: string },
): string {
  const sessionId = options?.sessionId ?? picks[0]?.sessionId ?? "unknown";
  const prompt = formatAllContextEnginePrompts(picks, options);
  const registry = JSON.stringify({ sessionId, picks }, null, 2);
  return `${prompt}\n\n---\nGRIP_SESSION_JSON\n${registry}`;
}
