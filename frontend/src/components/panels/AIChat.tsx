"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { analyzeWithAI, getAIStatus } from "@/lib/api";
import { genId, formatTimestamp } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const QUICK_QUERIES = [
  "Summarize global conflict activity in the last 24 hours",
  "What military activity is happening near Ukraine?",
  "Are there unusual aircraft patterns today?",
  "Which regions show rising tensions?",
  "Summarize maritime activity in the Middle East",
];

export default function AIChat() {
  const { chatMessages, addChatMessage, updateChatMessage, clearChat } = useAppStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ available: boolean; model: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getAIStatus()
      .then(setAiStatus)
      .catch(() => setAiStatus({ available: false, model: "unknown" }));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = async (query?: string) => {
    const text = (query ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    addChatMessage({ role: "user", content: text });

    const assistantId = genId();
    addChatMessage({ role: "assistant", content: "", loading: true });

    try {
      const result = await analyzeWithAI(text);
      updateChatMessage(assistantId, result.response, false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes("503")
          ? "Ollama is not running. Start Ollama and run: `ollama pull llama3`"
          : "Analysis failed. Please check the AI service.";
      updateChatMessage(assistantId, `⚠ ${msg}`, false);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* AI status bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0 bg-background-panel">
        <Bot className="w-3.5 h-3.5 text-accent-cyan" />
        <span className="font-mono text-[9px] text-text-secondary tracking-wider">
          {aiStatus?.model?.toUpperCase() ?? "AI ANALYST"}
        </span>
        <div className="flex-1" />
        {aiStatus && (
          <div className="flex items-center gap-1">
            {aiStatus.available ? (
              <CheckCircle className="w-3 h-3 text-accent-green" />
            ) : (
              <AlertCircle className="w-3 h-3 text-accent-red" />
            )}
            <span
              className={`font-mono text-[8px] ${
                aiStatus.available ? "text-accent-green" : "text-accent-red"
              }`}
            >
              {aiStatus.available ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        )}
        {chatMessages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-text-muted hover:text-accent-red ml-2 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <Bot className="w-8 h-8 text-accent-cyan/30 mx-auto mb-2" />
              <p className="font-mono text-[10px] text-text-muted text-center leading-relaxed">
                AI OSINT analyst ready.
                <br />
                Query me about global activity.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-mono text-[8px] text-text-muted tracking-widest px-1">
                QUICK QUERIES
              </p>
              {QUICK_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 rounded border border-border hover:border-accent-blue/50 bg-background-panel hover:bg-background-tertiary text-text-secondary hover:text-text-primary font-mono text-[9px] leading-relaxed transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex-shrink-0 bg-background-panel">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
            placeholder="Analyze OSINT data..."
            rows={2}
            className="flex-1 bg-background-tertiary border border-border rounded px-3 py-2 font-mono text-[10px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-blue/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-3 bg-accent-blue hover:bg-blue-600 disabled:bg-border disabled:cursor-not-allowed rounded transition-colors flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="font-mono text-[8px] text-text-muted mt-1.5 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5 bg-background-tertiary border border-border">
        {isUser ? (
          <User className="w-2.5 h-2.5 text-accent-blue" />
        ) : (
          <Bot className="w-2.5 h-2.5 text-accent-cyan" />
        )}
      </div>
      <div
        className={cn(
          "flex-1 rounded px-3 py-2 border",
          isUser
            ? "bg-accent-blue/10 border-accent-blue/30 ml-4"
            : "bg-background-panel border-border mr-4"
        )}
      >
        {msg.loading ? (
          <div className="flex gap-1 py-1">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        ) : (
          <p className="font-mono text-[9px] text-text-primary leading-relaxed whitespace-pre-wrap">
            {msg.content}
          </p>
        )}
        <p className="font-mono text-[7px] text-text-muted mt-1">
          {formatTimestamp(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}
