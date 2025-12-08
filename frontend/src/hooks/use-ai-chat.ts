"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { Message } from "@/components/chat/chat-interface";

interface UseAIChatOptions {
  agentId?: string;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export function useAIChat({ agentId, onMessage, onError }: UseAIChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      // Create user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        // Send request to AI endpoint
        const response = await api.post<{ response: string; thinking?: string; actions?: any[] }>(
          "/ai/chat",
          {
            message: content,
            agent_id: agentId,
            conversation_history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }
        );

        // Create assistant message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.response,
          timestamp: new Date(),
          thinking: response.thinking,
          actions: response.actions,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        onMessage?.(assistantMessage);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const error = new Error(err.message || "Failed to send message");
          setError(error);
          onError?.(error);

          // Add error message
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [agentId, messages, onMessage, onError]
  );

  const sendStreamingMessage = useCallback(
    async (content: string) => {
      // Create user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Create placeholder assistant message
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        thinking: "Thinking...",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/ai/stream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: content,
              agent_id: agentId,
              conversation_history: messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Streaming request failed");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === "thinking") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, thinking: data.content }
                        : m
                    )
                  );
                } else if (data.type === "content") {
                  fullContent += data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent, thinking: undefined }
                        : m
                    )
                  );
                } else if (data.type === "action") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            actions: [...(m.actions || []), data.action],
                          }
                        : m
                    )
                  );
                } else if (data.type === "done") {
                  // Final message received
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      } catch (err: any) {
        const error = new Error(err.message || "Streaming failed");
        setError(error);
        onError?.(error);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Sorry, I encountered an error. Please try again.",
                  thinking: undefined,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [agentId, messages, onError]
  );

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const removeLastMessage = useCallback(() => {
    setMessages((prev) => prev.slice(0, -1));
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendStreamingMessage,
    cancelRequest,
    clearMessages,
    removeLastMessage,
    setMessages,
  };
}
