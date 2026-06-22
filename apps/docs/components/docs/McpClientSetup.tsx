import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH3 } from "@components/docs/DocHeading";
import { McpClientIcon } from "@components/docs/McpClientIcon";
import { detectCodeLang } from "@lib/detect-code-lang";
import type { McpClientGuide } from "@lib/mcp-clients";

export function McpClientSetup({
  client,
  showHeading = true,
}: {
  client: McpClientGuide;
  showHeading?: boolean;
}) {
  return (
    <div className="doc-mcp-client">
      {showHeading ? (
        <DocH3 id={`mcp-${client.id}`}>
          <span className="doc-mcp-client-title">
            <McpClientIcon client={client} size={20} />
            {client.name}
          </span>
        </DocH3>
      ) : (
        <div className="doc-mcp-client-panel-head">
          <McpClientIcon client={client} size={22} />
          <h3 className="doc-mcp-client-panel-title">{client.name}</h3>
        </div>
      )}
      <p className="doc-mcp-client-meta">
        <strong>Config:</strong>{" "}
        {client.configPaths.map((path, i) => (
          <span key={path}>
            {i > 0 ? " · " : null}
            <code>{path}</code>
          </span>
        ))}
      </p>
      {client.rootKey ? (
        <p className="doc-mcp-client-meta">
          <strong>Root key:</strong> <code>{client.rootKey}</code>
        </p>
      ) : null}
      {client.notes?.map((note) => (
        <p key={note} className="doc-mcp-client-note">
          {note}
        </p>
      ))}
      {client.docsUrl ? (
        <p className="doc-mcp-client-note">
          <a href={client.docsUrl} target="_blank" rel="noreferrer">
            Official MCP docs →
          </a>
        </p>
      ) : null}
      <CodeBlock lang={detectCodeLang(client.config)}>{client.config}</CodeBlock>
    </div>
  );
}
