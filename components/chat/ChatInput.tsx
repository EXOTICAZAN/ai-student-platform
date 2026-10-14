"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
} from "react";

import { sendMessage } from "@/app/dashboard/tutor/actions";
import { STREAM_ERROR_PREFIX } from "@/lib/ai/stream-protocol";
import { toast } from "sonner";
import { takePendingPrompt } from "@/components/chat/pending-prompt";
import { useChat } from "./context/ChatContext";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface Props {
  chatId: string;
}

export default function ChatInput({ chatId }: Props) {
  const [message, setMessage] = useState("");

  const [pending, startTransition] = useTransition();

  const abortController =
    useRef<AbortController | null>(null);

  const { t, locale } = useLanguage();
  const {
    messages,
    setStreamingText,
    setIsStreaming,
    setIsThinking,
    addMessage,
    isStreaming,
    isThinking,
  } = useChat();

  // ==========================================
  // REGENERATE
  // ==========================================

  const sendPromptRef = useRef(sendPrompt);
  useEffect(() => {
    sendPromptRef.current = sendPrompt;
  });

  useEffect(() => {
    function handleRegenerate(event: Event) {
      const customEvent = event as CustomEvent;

      const prompt = customEvent.detail;

      if (!prompt) return;

      startTransition(() => {
        sendPromptRef.current(prompt, false);
      });
    }

    window.addEventListener(
      "regenerate",
      handleRegenerate
    );

    return () => {
      window.removeEventListener(
        "regenerate",
        handleRegenerate
      );
    };
  }, []);

  // ==========================================
  // AUTO-SEND THE OPENING MESSAGE
  // ==========================================

  const autoSent = useRef(false);
  useEffect(() => {
    if (autoSent.current) return;

    const prompt = takePendingPrompt(chatId);
    if (!prompt) return;

    autoSent.current = true;
    startTransition(() => {
      sendPromptRef.current(prompt);
    });
  }, [chatId, startTransition]);

  // ==========================================
  // STOP GENERATING
  // ==========================================

  function stopGenerating() {
    abortController.current?.abort();

    setIsThinking(false);
    setIsStreaming(false);
    setStreamingText("");

    abortController.current = null;
  }

  // ==========================================
  // SEND PROMPT
  // ==========================================

  async function sendPrompt(
    prompt: string,
    saveUserMessage = true
  ) {
    try {
      // ========================================
      // SAVE USER MESSAGE
      // ========================================

      if (saveUserMessage) {
        await sendMessage(
          chatId,
          prompt,
          "user"
        );

        addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: prompt,
        });
      }

      // ========================================
      // START THINKING
      // ========================================

      setIsThinking(true);
      setIsStreaming(false);
      setStreamingText("");

      abortController.current =
        new AbortController();

      // ========================================
      // CHAT API
      // ========================================

      const response = await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: prompt,

            // IMPORTANT:
            // Send the current chat ID.
            // The API uses this to find
            // the PDF attached to this chat.
            chatId,

            language: locale,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),

          signal:
            abortController.current.signal,
        }
      );

      // ========================================
      // CHECK API RESPONSE
      // ========================================

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Chat request failed"
        );
      }

      if (!response.body) {
        throw new Error(
          "No response body"
        );
      }

      // ========================================
      // STREAM RESPONSE
      // ========================================

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let fullResponse = "";
      let firstChunk = true;

      while (true) {
        const {
          done,
          value,
        } = await reader.read();

        if (done) break;

        // First token received
        if (firstChunk) {
          setIsThinking(false);
          setIsStreaming(true);
          firstChunk = false;
        }

        const chunk =
          decoder.decode(value, {
            stream: true,
          });

        fullResponse += chunk;

        if (fullResponse.includes(STREAM_ERROR_PREFIX)) {
          throw new Error("The tutor could not finish generating a reply.");
        }

        setStreamingText(
          fullResponse
        );
      }

      // ========================================
      // FINISH
      // ========================================

      setIsThinking(false);
      setIsStreaming(false);

      if (fullResponse.trim()) {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullResponse,
        });

        await sendMessage(
          chatId,
          fullResponse,
          "assistant"
        );
      }

      setStreamingText("");

      abortController.current = null;

    } catch (err) {
      const isAbort =
        err instanceof Error
          ? err.name === "AbortError"
          : err &&
            typeof err === "object" &&
            "name" in err &&
            err.name === "AbortError";

      if (!isAbort) {
        console.error(
          "Streaming Error:",
          err
        );
        toast.error(
          err instanceof Error
            ? err.message
            : "The tutor could not generate a reply. Please try again."
        );
      }

      setIsThinking(false);
      setIsStreaming(false);
      setStreamingText("");

      abortController.current = null;
    }
  }

  // ==========================================
  // HANDLE SEND
  // ==========================================

  function handleSend() {
    if (!message.trim()) return;

    const userMessage =
      message.trim();

    setMessage("");

    startTransition(() => {
      sendPrompt(userMessage);
    });
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="border-t border-white/10 p-4">
      <div className="flex gap-3">
        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder={t("askAnythingPlaceholder")}
          disabled={
            isStreaming ||
            isThinking
          }
          className="flex-1 rounded-xl bg-slate-900 p-4 text-white outline-none disabled:opacity-50"
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !isStreaming &&
              !isThinking
            ) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          type="button"
          onClick={() => {
            if (
              isStreaming ||
              isThinking
            ) {
              stopGenerating();
            } else {
              handleSend();
            }
          }}
          className={`rounded-xl px-6 font-semibold text-white transition-all ${
            isStreaming ||
            isThinking
              ? "bg-red-600 hover:bg-red-500"
              : "bg-indigo-600 hover:bg-indigo-500"
          }`}
        >
          {isStreaming ||
          isThinking
            ? `■ ${t("stop")}`
            : pending
            ? "Thinking..."
            : t("send")}
        </button>
      </div>
    </div>
  );
}