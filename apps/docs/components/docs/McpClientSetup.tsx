import { CodeBlock } from "@components/docs/CodeBlock";
import { DocH3 } from "@components/docs/DocHeading";
import type { McpClientGuide } from "@lib/mcp-clients";

export function McpClientSetup({ client }: { client: McpClientGuide }) {
  return (
    <div className="doc-mcp-client">
      <DocH3 id={`mcp-${client.id}`}>{client.name}</DocH3>
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
      <CodeBlock>{client.config}</CodeBlock>
    </div>
  );
}
