import readline from "node:readline";
import process from "node:process";
import { setup, showMcpDetails } from "@/commands/setup";
import { mcp } from "@/commands/mcp";
import { dev } from "@/commands/dev";
import { startDaemon, stopDaemon, statusDaemon } from "@/commands/daemon";
import { BANNER } from "@/logo";

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const COMMANDS = ["/start", "/stop", "/status", "/mcp", "/dev", "/setup", "/exit", "/help"];

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    await startInteractiveShell();
    process.exit(0);
  }

  // Hide banner for the foreground stdio "mcp" command to avoid corrupting JSON-RPC streams
  if (command !== "mcp") {
    console.log(BANNER);
  }

  await executeCommand(command, args.slice(1));
}

async function executeCommand(cmd: string, args: string[]): Promise<boolean> {
  const cleanCmd = cmd.startsWith("/") ? cmd.slice(1) : cmd;

  switch (cleanCmd.toLowerCase()) {
    case "setup":
    case "configure":
      await setup(args);
      break;
    case "up":
    case "start":
      await startDaemon();
      break;
    case "down":
    case "stop":
      await stopDaemon();
      break;
    case "status":
      await statusDaemon();
      break;
    case "mcp":
      await mcp(args);
      break;
    case "dev":
    case "launch":
      await dev(args);
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      console.error(`[error] unknown command: ${cmd}`);
      printHelp();
      return false;
  }
  return true;
}

function renderSuggestions(line: string) {
  // Save cursor position
  process.stdout.write("\x1b[s");

  // Move cursor down 1 line, clear line
  process.stdout.write("\n\x1b[K");

  if (line.startsWith("/")) {
    const matches = COMMANDS.filter((cmd) => cmd.startsWith(line));
    if (matches.length > 0) {
      process.stdout.write(
        `  ${colors.gray}suggestions: ${matches.map((m) => colors.cyan + m).join("  ")}${colors.reset}`
      );
    } else {
      process.stdout.write(`  ${colors.gray}no matching commands${colors.reset}`);
    }
  } else {
    process.stdout.write(
      `  ${colors.gray}type / for suggestions (${COMMANDS.join(", ")})${colors.reset}`
    );
  }

  // Restore cursor position
  process.stdout.write("\x1b[u");
}

function clearSuggestions() {
  // Save cursor position
  process.stdout.write("\x1b[s");
  // Move cursor down 1 line, clear line
  process.stdout.write("\n\x1b[K");
  // Restore cursor position
  process.stdout.write("\x1b[u");
}

async function startInteractiveShell() {
  console.log(BANNER);
  console.log('type "help" or "/help" for commands, "/exit" to quit.');
  console.log('(mcp server continues running in background)\n');

  const promptString = ` ${colors.bold}${colors.cyan}grip${colors.reset} ❯ `;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: promptString,
  });

  // Intercept keypresses to dynamically render suggestions
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const handleKeypress = () => {
    process.nextTick(() => {
      renderSuggestions(rl.line);
    });
  };

  process.stdin.on("keypress", handleKeypress);

  // Render initial suggestions
  renderSuggestions("");
  rl.prompt();

  for await (const line of rl) {
    const input = line.trim();
    
    // Clear suggestions line before running command output
    clearSuggestions();

    if (!input) {
      console.log(`${colors.gray}──────────────────────────────────────────────────${colors.reset}`);
      renderSuggestions("");
      rl.prompt();
      continue;
    }

    const [cmd, ...args] = input.split(/\s+/);
    if (!cmd) {
      console.log(`${colors.gray}──────────────────────────────────────────────────${colors.reset}`);
      renderSuggestions("");
      rl.prompt();
      continue;
    }

    const lowerCmd = cmd.toLowerCase();

    if (lowerCmd === "exit" || lowerCmd === "quit" || lowerCmd === "/exit" || lowerCmd === "/quit") {
      console.log("goodbye!");
      // Clean up keypress listeners and raw mode before exit
      process.stdin.removeListener("keypress", handleKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.exit(0);
    }

    if (lowerCmd === "help" || lowerCmd === "/help") {
      printShellHelp();
    } else if (lowerCmd === "mcp" || lowerCmd === "/mcp") {
      await showMcpDetails();
    } else {
      await executeCommand(lowerCmd, args);
    }
    
    console.log(); // empty line for spacing
    console.log(`${colors.gray}──────────────────────────────────────────────────${colors.reset}`);
    
    // Reset suggestions line for empty prompt
    renderSuggestions("");
    rl.prompt();
  }
}

function printHelp() {
  console.log(`
${colors.bold}usage:${colors.reset}
  grip <command> [options]

${colors.bold}commands:${colors.reset}
  start, up          start background mcp server
  stop, down         stop background mcp server
  status             show mcp server status
  setup, configure   configure ide integrations
  dev, launch        show development connection status
  mcp                run mcp server in stdio mode
  help               show help
`);
}

function printShellHelp() {
  console.log(`
commands:
  /start, /up        start background mcp server
  /stop, /down       stop background mcp server
  /status            show mcp server status
  /mcp               show mcp config and status
  /setup             configure ide integrations
  /dev               show development connection status
  /exit, /quit       exit shell
  /help              show help
`);
}

main().catch((err) => {
  console.error("[error] unhandled error:", err);
  process.exit(1);
});
