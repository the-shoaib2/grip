import { Tooltip } from "../Tooltip";

export interface GripMcpChipProps {
  connected: boolean;
  onConfigure: () => void;
}

export function GripMcpChip({ connected, onConfigure }: GripMcpChipProps) {
  if (connected) {
    return (
      <Tooltip text="MCP connected on :9222">
        <span className="grip-chip grip-chip-ok grip-mcp-chip">MCP</span>
      </Tooltip>
    );
  }

  return (
    <Tooltip text="MCP not configured — click for setup instructions">
      <button type="button" className="grip-chip grip-chip-error grip-mcp-chip" onClick={onConfigure}>
        MCP
      </button>
    </Tooltip>
  );
}
