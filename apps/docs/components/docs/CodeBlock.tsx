export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="doc-code">
      <code>{children}</code>
    </pre>
  );
}
