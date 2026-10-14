"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Model output and PDF text are untrusted. KaTeX's `trust` option enables
// \href, \url and similar commands, so it stays off explicitly; throwOnError
// off renders bad LaTeX as red source instead of crashing the message.
const KATEX_OPTIONS = { trust: false, throwOnError: false } as const;

interface Props {
  content: string;
}

export default function MarkdownMessage({ content }: Props) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}