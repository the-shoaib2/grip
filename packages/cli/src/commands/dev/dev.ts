import process from "node:process";

async function checkChromeDebugPort(port: string): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: AbortSignal.timeout(1000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkHttpBridge(port: string): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/session`, {
      method: "OPTIONS",
      signal: AbortSignal.timeout(1000),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function dev(args: string[]) {
  const chromePort = process.env.GRIP_CHROME_PORT || "9222";
  const httpPort = process.env.GRIP_HTTP_PORT || "9223";

  console.log("checking development connection status...");

  const [chromeActive, bridgeActive] = await Promise.all([
    checkChromeDebugPort(chromePort),
    checkHttpBridge(httpPort),
  ]);

  console.log("\ndevelopment status:");
  console.log(`  dev server (bridge): ${bridgeActive ? "active" : "inactive"} (port ${httpPort})`);
  console.log(`  chrome debug:        ${chromeActive ? "active" : "inactive"} (port ${chromePort})`);

  let statusText = "idle (server is stopped, run /start to begin)";
  if (bridgeActive && chromeActive) {
    statusText = "connected (ready to receive grip-dev sessions)";
  } else if (bridgeActive) {
    statusText = "bridge active (waiting for chrome debugging)";
  }

  console.log(`  grip-dev status:     ${statusText}`);
}
