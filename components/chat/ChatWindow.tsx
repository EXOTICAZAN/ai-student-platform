"use client";

import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";
import TypingCursor from "./TypingCursor";

import { useChat } from "./context/ChatContext";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function ChatWindow() {
  const { t } = useLanguage();
  const {
    messages,
    isStreaming,
    streamingText,
    isThinking,
  } = useChat();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [messages, streamingText, isThinking]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4"
    >
      {messages.length === 0 && (
        <div className="text-slate-500">
          {t("startChat")}
        </div>
      )}

      {messages.map((message, index) => {
        let previousPrompt = "";

        // ✅ Find the nearest previous USER message
        if (message.role === "assistant") {
          for (let i = index - 1; i >= 0; i--) {
            if (messages[i].role === "user") {
              previousPrompt = messages[i].content;
              break;
            }
          }
        }

        return (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            previousPrompt={previousPrompt}
          />
        );
      })}

      {/* Thinking */}
      {isThinking && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-slate-800 px-5 py-4 text-slate-300">
            <TypingCursor />
          </div>
        </div>
      )}

      {/* Streaming */}
      {isStreaming && (
        <MessageBubble
          role="assistant"
          content={streamingText}
          previousPrompt=""
        />
      )}
    </div>
  );
}