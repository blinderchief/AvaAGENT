"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Copy,
  RotateCcw,
  StopCircle,
  Settings,
  ChevronDown,
  Zap,
  Database,
  Shield,
  Code,
  Check,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  type: "trading" | "data" | "commerce" | "general";
  capabilities: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agent_id?: string;
  actions?: ActionResult[];
  thinking?: string;
}

interface ActionResult {
  type: string;
  status: "success" | "pending" | "failed";
  description: string;
  data?: Record<string, unknown>;
  tx_hash?: string;
}

const agentTypeConfig = {
  trading: { icon: Zap, color: "text-amber-500", bg: "bg-amber-500" },
  data: { icon: Database, color: "text-blue-500", bg: "bg-blue-500" },
  commerce: { icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500" },
  general: { icon: Bot, color: "text-zinc-500", bg: "bg-zinc-500" },
};

const suggestedPrompts = [
  { text: "Check my AVAX balance", icon: "💰" },
  { text: "Swap 1 AVAX for USDC", icon: "🔄" },
  { text: "What's the current gas price?", icon: "⛽" },
  { text: "Show my recent transactions", icon: "📜" },
  { text: "Stake 10 AVAX", icon: "🥩" },
  { text: "Get weather data for London", icon: "🌤️" },
];

export default function ChatPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [showThinking, setShowThinking] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["agents-active"],
    queryFn: () => api.get("/api/v1/agents/?status=active"),
  });

  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedAgent = agents?.find((a) => a.id === selectedAgentId);
  const agentConfig = selectedAgent ? agentTypeConfig[selectedAgent.type] : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Message copied to clipboard" });
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      agent_id: selectedAgentId || undefined,
      thinking: "",
      actions: [],
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          agent_id: selectedAgentId || null,
          conversation_id: messages.length > 0 ? messages[0].id : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to get response");
      }

      const data = await response.json();
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { 
                ...m, 
                content: data.response || data.message || "I received your message but couldn't generate a response.",
                thinking: data.thinking || "",
                actions: data.actions || []
              }
            : m
        )
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled the request
        return;
      }

      const errorMessage = error instanceof Error ? error.message : "Failed to get response from agent";
      
      // Update the assistant message with error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }
            : m
        )
      );

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [input, isStreaming, selectedAgentId, messages, toast]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-avalanche-500" />
            <h1 className="text-2xl font-bold">AI Chat</h1>
          </div>

          {/* Agent Selector */}
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              {agentsLoading ? (
                <div className="p-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : agents?.length === 0 ? (
                <div className="p-2 text-sm text-zinc-500">No active agents</div>
              ) : (
                agents?.map((agent) => {
                  const config = agentTypeConfig[agent.type];
                  const Icon = config.icon;
                  return (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        {agent.name}
                      </div>
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClearChat}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowThinking(!showThinking)}>
                {showThinking ? "Hide" : "Show"} Thinking Process
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
              {agentConfig ? (
                <>
                  <div
                    className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${agentConfig.bg}/10`}
                  >
                    <agentConfig.icon className={`h-8 w-8 ${agentConfig.color}`} />
                  </div>
                  <h2 className="text-xl font-semibold">{selectedAgent?.name}</h2>
                  <p className="mt-1 text-zinc-500">
                    Ready to help with {selectedAgent?.capabilities.slice(0, 3).join(", ")}
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-avalanche-500/10">
                    <Sparkles className="h-8 w-8 text-avalanche-500" />
                  </div>
                  <h2 className="text-xl font-semibold">AvaAgent AI</h2>
                  <p className="mt-1 text-zinc-500">
                    Select an agent to start chatting
                  </p>
                </>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="grid max-w-2xl gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedPrompt(prompt.text)}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-left text-sm transition-all hover:border-avalanche-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-avalanche-500"
                >
                  <span className="text-lg">{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === "user" ? (
                    <>
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback
                      className={cn(
                        agentConfig ? agentConfig.bg : "bg-avalanche-500",
                        "text-white"
                      )}
                    >
                      {agentConfig ? (
                        <agentConfig.icon className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Message Content */}
                <div
                  className={cn(
                    "group max-w-[80%] space-y-2",
                    message.role === "user" ? "items-end" : ""
                  )}
                >
                  {/* Thinking (collapsible) */}
                  {message.thinking && showThinking && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Thinking...
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400">{message.thinking}</p>
                    </div>
                  )}

                  {/* Main Content */}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-avalanche-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    )}
                  >
                    {message.content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {message.content.split("```").map((part, i) =>
                          i % 2 === 0 ? (
                            <p key={i} className="whitespace-pre-wrap">
                              {part}
                            </p>
                          ) : (
                            <pre
                              key={i}
                              className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-sm text-zinc-100"
                            >
                              <code>{part}</code>
                            </pre>
                          )
                        )}
                      </div>
                    ) : message.role === "assistant" && isStreaming ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Generating response...</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="space-y-2">
                      {message.actions.map((action, i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "rounded-full p-1",
                                  action.status === "success"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : action.status === "pending"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-red-500/10 text-red-500"
                                )}
                              >
                                {action.status === "success" ? (
                                  <Check className="h-3 w-3" />
                                ) : action.status === "pending" ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Code className="h-3 w-3" />
                                )}
                              </div>
                              <span className="text-sm font-medium">{action.type}</span>
                              <Badge
                                variant={
                                  action.status === "success"
                                    ? "success"
                                    : action.status === "pending"
                                    ? "warning"
                                    : "destructive"
                                }
                                className="ml-auto text-xs"
                              >
                                {action.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">
                              {action.description}
                            </p>
                            {action.tx_hash && (
                              <a
                                href={`https://testnet.snowtrace.io/tx/${action.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-avalanche-500 hover:underline"
                              >
                                View transaction →
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Message Actions */}
                  {message.role === "assistant" && message.content && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t pt-4 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Ask me anything about trading, wallets, or blockchain..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className="min-h-[56px] resize-none pr-24"
              rows={1}
            />
            <div className="absolute bottom-2 right-2 flex gap-1">
              {isStreaming ? (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-9 w-9"
                  onClick={handleStop}
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="gradient"
                  className="h-9 w-9"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-zinc-500">
            AvaAgent can make mistakes. Verify important transactions before confirming.
          </p>
        </div>
      </div>
    </div>
  );
}
