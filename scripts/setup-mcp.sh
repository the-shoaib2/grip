#!/usr/bin/env bash

set -euo pipefail

# Determine repository root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BINARY_PATH="${REPO_ROOT}/bin/grip-mcp"

echo "========================================="
echo "       Grip MCP Configurator Tool"
echo "========================================="
echo "Repository Root: ${REPO_ROOT}"
echo "Binary Location: ${BINARY_PATH}"
echo "-----------------------------------------"

# Check if the grip-mcp binary is built
if [ ! -f "${BINARY_PATH}" ]; then
  echo "⚠️  Warning: grip-mcp binary was not found at '${BINARY_PATH}'."
  read -p "Would you like to compile it now? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running build..."
    (cd "${REPO_ROOT}" && pnpm run build:mcp)
  else
    echo "Proceeding with configuration using the predicted path."
  fi
fi

# Define config file paths (macOS defaults)
CLAUDE_CONFIG_DIR="${HOME}/Library/Application Support/Claude"
CLAUDE_CONFIG_PATH="${CLAUDE_CONFIG_DIR}/claude_desktop_config.json"

CLINE_CONFIG_DIR="${HOME}/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings"
CLINE_CONFIG_PATH="${CLINE_CONFIG_DIR}/cline_mcp_settings.json"

ANTIGRAVITY_CONFIG_DIR="${HOME}/.gemini/antigravity-ide"
ANTIGRAVITY_CONFIG_PATH="${ANTIGRAVITY_CONFIG_DIR}/mcp_config.json"

CURSOR_CONFIG_PATH="${REPO_ROOT}/.cursor/mcp.json"

# Helper Node.js script to merge JSON configurations safely
merge_mcp_config() {
  local config_file="$1"
  local bin_path="$2"

  echo "Updating: ${config_file}..."

  # Create backup if file exists
  if [ -f "${config_file}" ]; then
    cp "${config_file}" "${config_file}.bak"
    echo "Created backup: ${config_file}.bak"
  fi

  # Call node inline parser
  node -e '
const fs = require("fs");
const path = require("path");

const targetFile = process.argv[1];
const binaryPath = process.argv[2];

let config = {};
if (fs.existsSync(targetFile)) {
  try {
    const raw = fs.readFileSync(targetFile, "utf8").trim();
    if (raw) {
      config = JSON.parse(raw);
    }
  } catch (e) {
    console.error("❌ Failed to parse existing JSON: " + e.message);
    process.exit(1);
  }
}

// Make sure target object exists
const mcpKey = "mcpServers";
if (!config[mcpKey]) {
  config[mcpKey] = {};
}

// Update grip configuration
config[mcpKey]["grip"] = {
  command: binaryPath,
  args: ["--port", "9222"],
  env: {
    GRIP_LOG_LEVEL: "info",
    GRIP_CHROME_PORT: "9222"
  }
};

try {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, JSON.stringify(config, null, 2), "utf8");
  console.log("✅ Successfully updated MCP configuration!");
} catch (e) {
  console.error("❌ Failed to write config: " + e.message);
  process.exit(1);
}
' "${config_file}" "${bin_path}"
}

show_menu() {
  echo
  echo "Please select which IDEs or agents to configure:"
  echo "1) Cursor IDE (project-level .cursor/mcp.json)"
  echo "2) Claude Desktop (global configuration)"
  echo "3) VS Code - Cline Extension"
  echo "4) Antigravity IDE (Gemini Code Assist config)"
  echo "5) All of the above"
  echo "6) Exit"
  echo
  read -p "Select option (1-6): " opt
  echo

  case $opt in
    1)
      merge_mcp_config "${CURSOR_CONFIG_PATH}" "${BINARY_PATH}"
      ;;
    2)
      merge_mcp_config "${CLAUDE_CONFIG_PATH}" "${BINARY_PATH}"
      ;;
    3)
      merge_mcp_config "${CLINE_CONFIG_PATH}" "${BINARY_PATH}"
      ;;
    4)
      merge_mcp_config "${ANTIGRAVITY_CONFIG_PATH}" "${BINARY_PATH}"
      ;;
    5)
      merge_mcp_config "${CURSOR_CONFIG_PATH}" "${BINARY_PATH}"
      merge_mcp_config "${CLAUDE_CONFIG_PATH}" "${BINARY_PATH}"
      merge_mcp_config "${CLINE_CONFIG_PATH}" "${BINARY_PATH}"
      merge_mcp_config "${ANTIGRAVITY_CONFIG_PATH}" "${BINARY_PATH}"
      ;;
    6)
      echo "Exiting configurator."
      exit 0
      ;;
    *)
      echo "Invalid selection. Please try again."
      show_menu
      ;;
  esac
}

show_menu
echo "-----------------------------------------"
echo "Configuration complete!"
