"use client";

import { useState } from "react";
import type { Node } from "unist";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

import {
  Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";

import {
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

interface Props {
  role: string;
  content: string;
  previousPrompt: string;
}

/**
 * Normalize Unicode characters ONLY inside Markdown math.
 *
 * Normal text remains unchanged:
 * 20–50 signs
 * 20–30 FPS
 *
 * Math gets normalized:
 * $20–30$ -> $20-30$
 * $a−b$   -> $a-b$
 */
interface UnistNode extends Node {
  children?: UnistNode[];
  value?: string;
}

function remarkNormalizeMath() {
  return (tree: UnistNode) => {
    function walk(node: UnistNode) {
      if (!node) return;

      if (
        (node.type === "inlineMath" ||
          node.type === "math") &&
        typeof node.value === "string"
      ) {
        node.value = node.value
          .replace(/–/g, "-")
          .replace(/—/g, "-")
          .replace(/−/g, "-")
          .replace(/≤/g, "\\leq ")
          .replace(/≥/g, "\\geq ")
          .replace(/×/g, "\\times ")
          .replace(/÷/g, "\\div ");
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(walk);
      }
    }

    walk(tree);
  };
}

export default function MessageBubble({
  role,
  content,
  previousPrompt,
}: Props) {
  const isUser = role === "user";

  const [copied, setCopied] = useState(false);

  // ==========================================
  // COPY MESSAGE
  // ==========================================

  async function copyText() {
    try {
      await navigator.clipboard.writeText(content);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("❌ Copy failed:", error);
    }
  }

  // ==========================================
  // REGENERATE MESSAGE
  // ==========================================

  function regenerate() {
    if (!previousPrompt) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("regenerate", {
        detail: previousPrompt,
      })
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-slate-800 text-slate-100"
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[
            remarkMath,
            remarkGfm,
            remarkNormalizeMath,
          ]}
          rehypePlugins={[
            rehypeKatex,
          ]}
          components={{
            // ==========================================
            // CODE
            // ==========================================

            code(props) {
              const {
                children,
                className,
              } = props;

              const match =
                /language-(\w+)/.exec(
                  className || ""
                );

              // ==========================================
              // CODE BLOCK
              // ==========================================

              if (match) {
                return (
                  <div className="my-3 overflow-hidden rounded-lg">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(
                        /\n$/,
                        ""
                      )}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              // ==========================================
              // INLINE CODE
              // ==========================================

              return (
                <code className="rounded bg-slate-700 px-1.5 py-0.5 text-sm">
                  {children}
                </code>
              );
            },

            // ==========================================
            // TABLE
            // ==========================================

            table({ children }) {
              return (
                <div className="my-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    {children}
                  </table>
                </div>
              );
            },

            th({ children }) {
              return (
                <th className="border border-slate-600 bg-slate-700 px-3 py-2 text-left font-semibold">
                  {children}
                </th>
              );
            },

            td({ children }) {
              return (
                <td className="border border-slate-600 px-3 py-2">
                  {children}
                </td>
              );
            },

            // ==========================================
            // LINKS
            // ==========================================

            a({ children, href }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 underline hover:text-indigo-200"
                >
                  {children}
                </a>
              );
            },

            // ==========================================
            // HEADINGS
            // ==========================================

            h1({ children }) {
              return (
                <h1 className="mb-3 mt-5 text-2xl font-bold">
                  {children}
                </h1>
              );
            },

            h2({ children }) {
              return (
                <h2 className="mb-3 mt-5 text-xl font-bold">
                  {children}
                </h2>
              );
            },

            h3({ children }) {
              return (
                <h3 className="mb-2 mt-4 text-lg font-semibold">
                  {children}
                </h3>
              );
            },

            // ==========================================
            // PARAGRAPH
            // ==========================================

            p({ children }) {
              return (
                <p className="mb-3 leading-7 last:mb-0">
                  {children}
                </p>
              );
            },

            // ==========================================
            // LISTS
            // ==========================================

            ul({ children }) {
              return (
                <ul className="mb-3 ml-5 list-disc space-y-1">
                  {children}
                </ul>
              );
            },

            ol({ children }) {
              return (
                <ol className="mb-3 ml-5 list-decimal space-y-1">
                  {children}
                </ol>
              );
            },

            li({ children }) {
              return (
                <li className="leading-7">
                  {children}
                </li>
              );
            },

            // ==========================================
            // BLOCKQUOTE
            // ==========================================

            blockquote({ children }) {
              return (
                <blockquote className="my-3 border-l-4 border-indigo-400 pl-4 italic text-slate-300">
                  {children}
                </blockquote>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>

        {/* ==========================================
            MESSAGE ACTIONS
        ========================================== */}

        {!isUser && (
          <div className="mt-4 flex justify-end gap-2">
            {/* COPY */}

            <button
              type="button"
              onClick={copyText}
              className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>

            {/* REGENERATE */}

            <button
              type="button"
              onClick={regenerate}
              className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              <RotateCcw size={16} />
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}