"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
}

interface ChatContextType {
  messages: ChatMessage[];

  setMessages: React.Dispatch<
    React.SetStateAction<ChatMessage[]>
  >;

  addMessage: (message: ChatMessage) => void;

  updateLastMessage: (content: string) => void;

  streamingText: string;
  setStreamingText: React.Dispatch<
    React.SetStateAction<string>
  >;

  isStreaming: boolean;
  setIsStreaming: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  // NEW
  isThinking: boolean;
  setIsThinking: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

const ChatContext = createContext<ChatContextType | null>(
  null
);

export function ChatProvider({
  initialMessages,
  children,
}: {
  initialMessages: ChatMessage[];
  children: ReactNode;
}) {
  const [messages, setMessages] =
    useState(initialMessages);

  const [streamingText, setStreamingText] =
    useState("");

  const [isStreaming, setIsStreaming] =
    useState(false);

  // NEW
  const [isThinking, setIsThinking] =
    useState(false);

  function addMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  function updateLastMessage(content: string) {
    setMessages((prev) => {
      if (!prev.length) return prev;

      const copy = [...prev];

      copy[copy.length - 1] = {
        ...copy[copy.length - 1],
        content,
      };

      return copy;
    });
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        addMessage,
        updateLastMessage,

        streamingText,
        setStreamingText,

        isStreaming,
        setIsStreaming,

        // NEW
        isThinking,
        setIsThinking,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);

  if (!ctx) {
    throw new Error(
      "useChat must be used inside ChatProvider"
    );
  }

  return ctx;
}