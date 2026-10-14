"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Model output and PDF text are untrusted. KaTeX's `trust` option enables
// \href, \url and similar commands, so it stays off explicitly; throwOnError
// off renders bad LaTeX as red source instead of crashing the message.
const KATEX_OPTIONS = { trust: false, throwOnError: false } as const;

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
      components={{
        code(props) {
          const { children, className } = props;

          const match = /language-(\w+)/.exec(className || "");

          if (match) {
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          }

          return (
            <code className="rounded bg-slate-800 px-1 py-0.5">
              {children}
            </code>
          );
        },

        table(props) {
          return (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                {props.children}
              </table>
            </div>
          );
        },

        th(props) {
          return (
            <th className="border border-slate-700 bg-slate-900 p-2 text-left">
              {props.children}
            </th>
          );
        },

        td(props) {
          return (
            <td className="border border-slate-700 p-2">
              {props.children}
            </td>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}