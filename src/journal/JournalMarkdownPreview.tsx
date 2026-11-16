import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function JournalMarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-border px-6 text-center text-sm text-text-muted">
        A visualização aparecerá aqui quando você escrever a anotação do dia.
      </div>
    );
  }

  return (
    <article className="journal-markdown min-h-80 rounded-lg border border-border bg-bg/50 px-5 py-4 text-sm leading-7 text-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, ...props }) => (
            <a
              {...props}
              className="text-lane-a underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
