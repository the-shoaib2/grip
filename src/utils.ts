export function log(level: string, message: string): void {
  const envLevel = process.env.GRIP_LOG_LEVEL ?? "info";
  const levels = ["error", "warn", "info", "debug"];
  const current = levels.indexOf(envLevel);
  const msg = levels.indexOf(level);
  if (msg <= current || current === -1) {
    console.error(`[grip:${level}] ${message}`);
  }
}

export function parseArgs(argv: string[]): { port: number } {
  let port = 9229;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--port" && argv[i + 1]) {
      port = parseInt(argv[i + 1], 10);
      i++;
    }
  }
  return { port };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
