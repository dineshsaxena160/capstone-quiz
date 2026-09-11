interface CodeBlockProps {
  code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  return (
    <pre className="code-block" aria-label="Code sample">
      <code>{code}</code>
    </pre>
  );
}
