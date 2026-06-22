import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GripContext } from "./context.js";
import { snapshotTool } from "./tools/snapshot.js";
import { highlightTool } from "./tools/highlight.js";
import { clickTool } from "./tools/click.js";
import { fillTool } from "./tools/fill.js";
import { readLogsTool } from "./tools/read-logs.js";
import { readNetworkTool } from "./tools/read-network.js";
import { screenshotTool } from "./tools/screenshot.js";
import { pickElementTool } from "./tools/pick-element.js";

const INSTRUCTIONS = `Grip — browser automation via Chrome DevTools Protocol.

Core rules:
1. Always snapshot before acting. Refs expire on navigation.
2. Prefer accessibility refs over coordinates.
3. Re-snapshot after any navigation or SPA route change.
4. Read logs proactively after page loads and user actions.
5. Surface errors immediately from read_logs.
6. Never guess selectors — derive from live snapshot.
7. Highlight before click or fill.
8. Confirm destructive actions unless told to proceed.
9. Note shadow DOM and iframe context explicitly.`;

export function createServer(ctx: GripContext): McpServer {
  const server = new McpServer(
    {
      name: "grip",
      version: "0.1.0",
    },
    {
      instructions: INSTRUCTIONS,
    },
  );

  server.tool(
    "snapshot",
    "Get the full accessibility tree + ref map of the current page.",
    {
      frameId: z
        .string()
        .optional()
        .describe("Optional iframe frame ID to snapshot"),
    },
    async ({ frameId }) => {
      const text = await snapshotTool(ctx, frameId);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    "highlight",
    "Draw a visible blue overlay on the element for confirmation.",
    { ref: z.string().describe("Element ref from snapshot") },
    async ({ ref }) => {
      const text = await highlightTool(ctx, ref);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    "click",
    "Click an element by ref.",
    { ref: z.string().describe("Element ref from snapshot") },
    async ({ ref }) => {
      const text = await clickTool(ctx, ref);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    "fill",
    "Type into an input or textarea.",
    {
      ref: z.string().describe("Element ref from snapshot"),
      value: z.string().describe("Text to type"),
    },
    async ({ ref, value }) => {
      const text = await fillTool(ctx, ref, value);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    "read_logs",
    "Returns buffered console output from the page.",
    {
      level: z
        .enum(["log", "warn", "error", "all"])
        .optional()
        .describe("Filter by log level"),
    },
    async ({ level }) => {
      const text = await readLogsTool(ctx, level);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    "read_network",
    "Returns recent network requests as HAR entries.",
    {
      filter: z
        .object({
          url: z.string().optional(),
          method: z.string().optional(),
          status: z.number().optional(),
        })
        .optional()
        .describe("Optional filters"),
    },
    async ({ filter }) => {
      const text = await readNetworkTool(ctx, filter);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    "screenshot",
    "Capture a screenshot of the full page or a specific element.",
    {
      selector: z
        .string()
        .optional()
        .describe("Optional ref or selector to scope screenshot"),
    },
    async ({ selector }) => {
      const text = await screenshotTool(ctx, selector);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    "pick_element",
    "Activate visual element picker. User clicks an element; returns ref, selectors, and metadata.",
    {},
    async () => {
      const text = await pickElementTool(ctx);
      return { content: [{ type: "text", text }] };
    },
  );

  return server;
}
