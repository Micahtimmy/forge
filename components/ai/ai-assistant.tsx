"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DEMO_STORIES,
  DEMO_UPDATES,
  DEMO_PIS,
  DEMO_TEAM,
  DEMO_SPRINTS,
} from "@/lib/demo/mock-data";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const SUGGESTED_QUERIES = [
  "Show me individual contributions on the team",
  "How is the current sprint doing?",
  "Which stories are at risk?",
  "What's our team velocity?",
  "Who has the highest quality scores?",
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (query?: string) => {
    const text = query || input.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: {
            stories: DEMO_STORIES,
            sprints: DEMO_SPRINTS,
            team: DEMO_TEAM,
            pis: DEMO_PIS,
            updates: DEMO_UPDATES,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Chat error:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMarkdown = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} className="font-semibold text-text-primary mt-3 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="font-bold text-text-primary mt-3 mb-2">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={i} className="font-bold text-lg text-text-primary mt-3 mb-2">{line.replace('# ', '')}</h2>;
      }

      // Bold text
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="mb-1">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
            )}
          </p>
        );
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <p key={i} className="ml-3 mb-0.5">{line}</p>;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        return <p key={i} className="ml-3 mb-0.5">{line}</p>;
      }

      // Table rows
      if (line.startsWith('|')) {
        return <p key={i} className="font-mono text-xs">{line}</p>;
      }

      // Empty lines
      if (!line.trim()) {
        return <div key={i} className="h-2" />;
      }

      return <p key={i} className="mb-1">{line}</p>;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-iris text-white shadow-lg shadow-iris/25",
          "flex items-center justify-center",
          "hover:bg-iris-light transition-colors",
          isOpen && "hidden"
        )}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-[420px] h-[600px] max-h-[80vh]",
              "bg-surface-01 border border-border rounded-xl shadow-xl",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-02">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-iris flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">FORGE AI</h3>
                  <p className="text-xs text-text-tertiary">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Sparkles className="w-12 h-12 text-iris mx-auto mb-4" />
                  <h4 className="font-medium text-text-primary mb-2">
                    Ask me anything about your data
                  </h4>
                  <p className="text-sm text-text-secondary mb-4">
                    I can analyze sprints, team performance, individual contributions, and more.
                  </p>
                  <div className="space-y-2">
                    {SUGGESTED_QUERIES.map((query) => (
                      <button
                        key={query}
                        onClick={() => handleSend(query)}
                        className="block w-full text-left px-3 py-2 text-sm text-text-secondary bg-surface-02 hover:bg-surface-03 rounded-lg transition-colors"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "user"
                        ? "bg-surface-03"
                        : message.isError
                        ? "bg-coral"
                        : "bg-iris"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2",
                      message.role === "user"
                        ? "bg-iris text-white"
                        : message.isError
                        ? "bg-coral/10 text-coral border border-coral/20"
                        : "bg-surface-02 text-text-primary"
                    )}
                  >
                    <div className="text-sm">
                      {message.role === "assistant"
                        ? renderMarkdown(message.content)
                        : message.content
                      }
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-iris flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-surface-02 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing data...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-surface-02">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your sprints, team, or metrics..."
                  disabled={isTyping}
                  className="flex-1 bg-surface-03 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-iris disabled:opacity-50"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
