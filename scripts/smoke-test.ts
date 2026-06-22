import { CdpClient, wireNavigationInvalidation } from "../src/cdp/client.js";
import { GripContext } from "../src/context.js";
import { snapshotTool } from "../src/tools/snapshot.js";
import { highlightTool } from "../src/tools/highlight.js";
import { fillTool } from "../src/tools/fill.js";
import { readLogsTool } from "../src/tools/read-logs.js";
import { screenshotTool } from "../src/tools/screenshot.js";
import { sleep } from "../src/utils.js";

async function main(): Promise<void> {
  const client = new CdpClient(9229);
  await client.connect();
  const ctx = new GripContext(client);
  wireNavigationInvalidation(client, ctx.refMap);
  await ctx.init();

  const page = client.getPage();
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><title>Grip Smoke Test</title></head>
      <body>
        <h1>Grip Smoke Test</h1>
        <input id="name" aria-label="Name" placeholder="Enter name" />
        <button id="btn">Click Me</button>
        <script>
          console.log('smoke test loaded');
          console.error('smoke test error');
        </script>
      </body>
    </html>
  `);

  await sleep(600);

  const snap = JSON.parse(await snapshotTool(ctx));
  if (!snap.yaml || Object.keys(snap.refs).length === 0) {
    throw new Error("snapshot returned no refs");
  }
  console.log("snapshot:", snap.title, `${Object.keys(snap.refs).length} refs`);

  const inputRef = Object.entries(snap.refs).find(
    ([, e]) => e.role === "textbox" || e.name === "Name",
  )?.[0];
  if (!inputRef) throw new Error("no input ref found");

  await highlightTool(ctx, inputRef);
  await fillTool(ctx, inputRef, "Grip");
  console.log("fill: ok");

  const logs = JSON.parse(await readLogsTool(ctx, "error"));
  if (logs.length === 0) throw new Error("expected error logs");
  console.log("read_logs:", logs.length, "errors");

  const shot = JSON.parse(await screenshotTool(ctx));
  if (!shot.base64) throw new Error("screenshot missing base64");
  console.log("screenshot:", shot.base64.length, "bytes base64");

  await client.disconnect();
  console.log("SMOKE TEST PASSED");
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
