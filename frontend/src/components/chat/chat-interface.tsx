"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  thinking?: string;
  actions?: {
    type: string;
    status: "pending" | "success" | "error";
    data?: any;
  }[];
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  agentName?: string;
  agentAvatar?: string;
  placeholder?: string;
  className?: string;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  agentName = "AvaAgent",
  agentAvatar,
  placeholder = "Type your message...",
  className,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-avalanche-500/20 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-avalanche-500 to-avalanche-600 shadow-xl">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-semibold">
                Start a conversation
              </h3>
              <p className="mt-2 text-zinc-500 max-w-sm">
                Ask {agentName} to perform tasks, execute transactions, or get
                information about your agents and wallets.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "Check my wallet balance",
                  "Create a new trading agent",
                  "What are my active agents?",
                  "Swap 0.1 AVAX for USDC",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    onClick={() => onSendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === "assistant" ? (
                    <>
                      <AvatarImage src={agentAvatar} />
                      <AvatarFallback className="bg-avalanche-500 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={cn(
                    "flex-1 space-y-2",
                    message.role === "user" && "text-right"
                  )}
                >
                  {/* Thinking indicator */}
                  {message.thinking && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="italic">{message.thinking}</span>
                    </div>
                  )}

                  {/* Message content */}
                  <div
                    className={cn(
                      "inline-block max-w-[85%] rounded-2xl px-4 py-2.5",
                      message.role === "assistant"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-left"
                        : "bg-avalanche-500 text-white"
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                  </div>

                  {/* Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {message.actions.map((action, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
                            action.status === "success" &&
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                            action.status === "pending" &&
                              "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            action.status === "error" &&
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {action.status === "pending" && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {action.status === "success" && (
                            <Check className="h-3 w-3" />
                          )}
                          <span>{action.type}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs text-zinc-400",
                      message.role === "user" && "justify-end"
                    )}
                  >
                    <span>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.role === "assistant" && (
                      <button
                        onClick={() =>
                          copyToClipboard(message.content, message.id)
                        }
                        className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-avalanche-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="min-h-[52px] max-h-[200px] pr-14 resize-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              variant="gradient"
              className="absolute right-2 bottom-2 h-9 w-9"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-zinc-400 mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
