import type { McpClientGuide } from "@lib/mcp-clients";
import { getMcpClientIconUrl, usesSimpleIcon } from "@lib/mcp-client-icons";

export function McpClientIcon({
  client,
  size = 18,
  className = "",
}: {
  client: McpClientGuide;
  size?: number;
  className?: string;
}) {
  const mono = usesSimpleIcon(client);

  return (
    <img
      src={getMcpClientIconUrl(client)}
      alt=""
      width={size}
      height={size}
      className={`doc-mcp-client-icon${mono ? " doc-mcp-client-icon-mono" : ""} ${className}`.trim()}
      loading="lazy"
      decoding="async"
    />
  );
}
