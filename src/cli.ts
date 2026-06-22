import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CdpClient, wireNavigationInvalidation } from "./cdp/client.js";
import { GripContext } from "./context.js";
import { createServer } from "./server.js";
import { log, parseArgs } from "./utils.js";

async function main(): Promise<void> {
  const { port } = parseArgs(process.argv);
  log("info", `Starting grip-mcp on CDP port ${port}`);

  const client = new CdpClient(port);
  await client.connect();

  const ctx = new GripContext(client);
  wireNavigationInvalidation(client, ctx.refMap);
  await ctx.init();

  const url = await client.getUrl();
  const title = await client.getTitle();
  log("info", `Connected: ${title} — ${url}`);

  const server = createServer(ctx);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("info", "MCP server running on stdio");
}

main().catch((err) => {
  console.error(`[grip:error] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
