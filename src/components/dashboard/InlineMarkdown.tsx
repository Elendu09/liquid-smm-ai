import { ReactNode } from "react";

/**
 * Lightweight inline markdown → JSX renderer.
 * Supports **bold**, *italic*, `code`, and turns *, -, • bullet lines into a numbered list.
 * Intentionally tiny — for AI assistant/response blurbs, not full markdown docs.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Split on **bold**, *italic*, or `code` (greedy-safe order)
  const regex = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key} className="px-1 py-0.5 rounded bg-muted text-[0.85em] font-mono">{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<em key={key} className="italic font-[450] tracking-[-0.01em] text-foreground/90">{token.slice(1, -1)}</em>);
    }
    lastIdx = match.index + token.length;
  }
  if (lastIdx < text.length) nodes.push(text.slice(lastIdx));
  return nodes;
}

interface InlineMarkdownProps {
  text: string;
  className?: string;
}

export function InlineMarkdown({ text, className }: InlineMarkdownProps) {
  const rawLines = text.split(/\r?\n/);

  // Group consecutive bullet lines (starting with *, -, •) into <ol> so the user sees numbers.
  type Block =
    | { type: "list"; items: string[] }
    | { type: "para"; text: string }
    | { type: "blank" };

  const blocks: Block[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length) {
      blocks.push({ type: "list", items: listBuffer });
      listBuffer = [];
    }
  };

  for (const line of rawLines) {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^(?:\*|-|•)\s+(.*)$/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
    } else if (trimmed === "") {
      flushList();
      blocks.push({ type: "blank" });
    } else {
      flushList();
      blocks.push({ type: "para", text: line });
    }
  }
  flushList();

  return (
    <div className={className}>
      {blocks.map((b, idx) => {
        if (b.type === "blank") return <div key={idx} className="h-2" />;
        if (b.type === "list") {
          return (
            <ol key={idx} className="list-decimal list-outside pl-5 space-y-1 my-1.5 marker:text-muted-foreground marker:font-medium">
              {b.items.map((item, i) => (
                <li key={i} className="pl-1">{renderInline(item, `${idx}-${i}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="leading-relaxed whitespace-pre-wrap">
            {renderInline(b.text, String(idx))}
          </p>
        );
      })}
    </div>
  );
}
