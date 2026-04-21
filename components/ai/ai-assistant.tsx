"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  User,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const DEMO_RESPONSES: Record<string, string> = {
  "how is sprint 22": `**Sprint 22 Status**

Sprint 22 is **80% complete** with 2 days remaining.

**Health Score:** 78% (Good)

**Progress:**
- 8 stories done (24 points)
- 2 stories in progress (6 points)
- 2 stories at risk

**Stories at Risk:**
1. FORGE-102 (Score: 38) - Missing acceptance criteria
2. FORGE-104 (Score: 45) - Vague requirements

**Recommendation:** Focus on refining FORGE-102 today. The payment integration story needs clear acceptance criteria before development continues.`,

  "blocked stories": `**Blocked Stories in Current Sprint**

Found **2 stories** that need attention:

1. **FORGE-102: Paystack payment integration**
   - Status: To Do
   - Blocker: Missing acceptance criteria
   - Days waiting: 2
   - Action: Add specific test scenarios for payment flows

2. **FORGE-109: Story export to CSV/PDF**
   - Status: To Do
   - Blocker: No assignee, incomplete requirements
   - Days waiting: 1
   - Action: Assign and refine with PM

Would you like me to draft acceptance criteria for any of these?`,

  "velocity": `**Velocity Analysis - Last 5 Sprints**

| Sprint | Committed | Completed | Rate |
|--------|-----------|-----------|------|
| S18    | 26        | 24        | 92%  |
| S19    | 28        | 26        | 93%  |
| S20    | 30        | 28        | 93%  |
| S21    | 28        | 28        | 100% |
| S22    | 32        | 24*       | 75%* |

*Sprint 22 in progress

**Average Velocity:** 26.5 points/sprint
**Trend:** Stable with slight increase

**Insight:** The team consistently delivers 93% of committed work. S22 has higher commitment - may need to adjust scope if blockers aren't resolved by Day 8.`,

  "compare teams": `**Team Comparison - PI 2026.2**

| Metric       | Platform | Integrations | Analytics |
|--------------|----------|--------------|-----------|
| Velocity     | 85%      | 78%          | 72%       |
| Quality      | 88%      | 82%          | 90%       |
| Consistency  | 92%      | 75%          | 85%       |
| Collaboration| 78%      | 88%          | 80%       |

**Key Insights:**
- Platform team leads in velocity and consistency
- Analytics has highest quality scores
- Integrations excels at cross-team collaboration

**Recommendation:** Platform could mentor Integrations on consistency practices. Analytics could share quality review techniques.`,

  "pi objectives": `**PI 2026.2 Objectives Status**

**Committed Objectives:**

1. **Launch payment processing** - 85% confidence
   - On track
   - Dependency on Paystack API docs resolved

2. **95% JIRA sync reliability** - 95% confidence
   - Ahead of schedule
   - Already at 98% in testing

3. **Mobile app beta (100 users)** - 70% confidence
   - At risk
   - Blocker: Design resources stretched
   - Mitigation: Borrowed designer from Quickteller

**Uncommitted:**

4. **Page load <2s** - 60% confidence
   - Stretch goal
   - Needs performance audit first

**Action Required:** Mobile beta confidence declining - recommend escalation to RTE.`,

  default: `I can help you with questions about:

- **Sprint status** - "How is Sprint 22 doing?"
- **Blocked work** - "Show blocked stories"
- **Velocity trends** - "What's our velocity?"
- **Team comparisons** - "Compare Platform and Analytics teams"
- **PI objectives** - "What's at risk for PI 2026.2?"
- **Individual work** - "What did Chidi work on last sprint?"

What would you like to know?`,
};

function findResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("sprint 22") || q.includes("sprint") && q.includes("how")) {
    return DEMO_RESPONSES["how is sprint 22"];
  }
  if (q.includes("block") || q.includes("stuck") || q.includes("impediment")) {
    return DEMO_RESPONSES["blocked stories"];
  }
  if (q.includes("velocity") || q.includes("speed") || q.includes("throughput")) {
    return DEMO_RESPONSES["velocity"];
  }
  if (q.includes("compare") || q.includes("team") && q.includes("vs")) {
    return DEMO_RESPONSES["compare teams"];
  }
  if (q.includes("pi") || q.includes("objective") || q.includes("risk")) {
    return DEMO_RESPONSES["pi objectives"];
  }
  return DEMO_RESPONSES["default"];
}

const SUGGESTED_QUERIES = [
  "How is Sprint 22 doing?",
  "Show blocked stories",
  "What's our velocity trend?",
  "Compare team performance",
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
    if (!text) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = findResponse(text);
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
              "w-[400px] h-[600px] max-h-[80vh]",
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
                  <p className="text-xs text-text-tertiary">Ask me anything</p>
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
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-iris mx-auto mb-4" />
                  <h4 className="font-medium text-text-primary mb-2">
                    How can I help you?
                  </h4>
                  <p className="text-sm text-text-secondary mb-4">
                    Ask about sprints, teams, velocity, or any metrics.
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
                      "max-w-[80%] rounded-lg px-3 py-2",
                      message.role === "user"
                        ? "bg-iris text-white"
                        : "bg-surface-02 text-text-primary"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap prose prose-sm prose-invert max-w-none">
                      {message.content.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={i} className="font-semibold">{line.replace(/\*\*/g, '')}</p>;
                        }
                        if (line.startsWith('- ') || line.startsWith('* ')) {
                          return <p key={i} className="ml-2">{line}</p>;
                        }
                        if (line.startsWith('|')) {
                          return <p key={i} className="font-mono text-xs">{line}</p>;
                        }
                        return <p key={i}>{line || '\u00A0'}</p>;
                      })}
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
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-text-tertiary rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-text-tertiary rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-text-tertiary rounded-full"
                      />
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
                  placeholder="Ask about your sprints, teams, or metrics..."
                  className="flex-1 bg-surface-03 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-iris"
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
