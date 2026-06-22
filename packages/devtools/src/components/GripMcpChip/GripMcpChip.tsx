import { McpIcon } from "../icons";
import { Tooltip } from "../Tooltip";

export interface GripMcpChipProps {
  connected: boolean;
  onConfigure: () => void;
}

function McpChipContent() {
  return (
    <>
      <McpIcon size={10} className="grip-mcp-chip-icon" />
      <span className="grip-mcp-chip-label">MCP</span>
    </>
  );
}

export function GripMcpChip({ connected, onConfigure }: GripMcpChipProps) {
  if (connected) {
    return (
      <Tooltip text="MCP connected on :9222">
        <span className="grip-chip grip-chip-ok grip-mcp-chip">
          <McpChipContent />
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip text="MCP not configured — click for setup instructions">
      <button type="button" className="grip-chip grip-chip-warn grip-mcp-chip" onClick={onConfigure}>
        <McpChipContent />
      </button>
    </Tooltip>
  );
}
