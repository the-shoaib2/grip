#!/usr/bin/env node
/**
 * CLI fallback: enrich Context Blocks with source from disk.
 * Usage: node enrich-context.mjs '<json array of partial blocks>'
 */
import { enrichContextBlock, formatContextEnginePrompt } from "../dist/index.js";

const workspaceRoot = process.env.GRIP_WORKSPACE_ROOT ?? process.cwd();
const raw = process.argv[2];

if (!raw) {
  console.error("Usage: enrich-context.mjs '<json blocks>'");
  process.exit(1);
}

const blocks = JSON.parse(raw);
const enriched = [];
for (const block of blocks) {
  enriched.push(await enrichContextBlock(block, { workspaceRoot }));
}
console.log(formatContextEnginePrompt(enriched));
