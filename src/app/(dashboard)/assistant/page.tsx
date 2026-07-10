"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Languages,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc/client";

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "fil", label: "Filipino" },
  { id: "ko", label: "Korean" },
  { id: "zh", label: "Chinese" },
] as const;

const SUGGESTED_QUESTIONS = [
  "How do I renew my visa?",
  "What documents do I need for enrollment?",
  "Tell me about exchange programs",
  "Where is the ISSO office?",
  "What are the emergency contacts?",
  "How do I apply for a Special Study Permit?",
];

type LanguageId = (typeof LANGUAGES)[number]["id"];

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
}

export default function AssistantPage() {
  const [language, setLanguage] = useState<LanguageId>("en");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: historyData, isLoading: isLoadingHistory } = trpc.chat.getHistory.useQuery();

  const messages: Message[] = (historyData?.messages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role as "USER" | "ASSISTANT",
    content: msg.content,
    createdAt: new Date(msg.createdAt),
  }));

  const sendMutation = trpc.chat.sendMessage.useMutation({
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      utils.chat.getHistory.invalidate();
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
    },
  });

  const clearMutation = trpc.chat.clearHistory.useMutation({
    onSuccess: () => {
      utils.chat.getHistory.invalidate();
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;

    setInput("");
    sendMutation.mutate({ content: trimmed, language });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      clearMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">
              Multilingual support for international students
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Select value={language} onValueChange={(v) => setLanguage(v as LanguageId)}>
              <SelectTrigger className="w-32 h-8" aria-label="Select language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Clear history */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            disabled={clearMutation.isPending || messages.length === 0}
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 py-4">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 && !isTyping ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Welcome to ODYSSEY AI Assistant</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              I can help you with visa processes, academic orientation, campus services,
              and more. Ask me anything about studying at the University of Batangas!
            </p>
            <div className="w-full max-w-lg">
              <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
                Suggested questions:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start h-auto py-2 px-3 whitespace-normal text-left"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="space-y-4 px-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "USER" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "ASSISTANT" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "USER"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
                {message.role === "USER" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Suggested Questions (when there are messages) */}
      {messages.length > 0 && !isTyping && (
        <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-thin">
          {SUGGESTED_QUESTIONS.slice(0, 3).map((question) => (
            <Button
              key={question}
              variant="outline"
              size="sm"
              className="text-xs shrink-0"
              onClick={() => handleSuggestedQuestion(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === "en"
                ? "Type your question..."
                : language === "fil"
                  ? "Itype ang iyong tanong..."
                  : language === "ko"
                    ? "질문을 입력하세요..."
                    : "输入您的问题..."
            }
            disabled={sendMutation.isPending}
            aria-label="Chat message input"
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            size="sm"
            className="shrink-0"
            aria-label="Send message"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI responses are for guidance only. Please verify important information with the ISSO office.
        </p>
      </div>
    </div>
  );
}
