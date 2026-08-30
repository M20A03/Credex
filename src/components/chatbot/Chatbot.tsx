"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AISelector from "@/components/chatbot/AISelector";
import { useAuditStore } from "@/store/auditStore";
import { apiFetch } from "@/lib/fetcher";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface StoredMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: string;
}

type FormContext = {
  tools?: Array<{ toolId: string; planId: string; seats: number }>;
  teamSize?: number;
};

const QUICK_REPLIES = [
  "How do savings work?",
  "Show me an example audit",
  "What's the catch? (it's free)",
  "Compare Cursor vs Copilot",
  "Talk to a human",
];

const FAQ_FALLBACKS: Record<string, string> = {
  "how do savings work":
    "🧮 We compare what you're currently paying for each AI tool against the optimal plan for your team size. For example, if you have 2 developers on GitHub Copilot Business (₹1,615/seat), we check if Individual (₹850/seat) covers your needs — saving ₹1,530/mo! Every recommendation links to official pricing pages.",
  "example audit":
    "📊 Say you have: Cursor Pro (2 seats = ₹3,400/mo) + Claude Team (3 seats = ₹6,375/mo) + ChatGPT Plus (1 seat = ₹1,700/mo). Total: ₹11,475/mo. Our audit might suggest: Windsurf Pro instead of Cursor (saves ₹340/mo) + Claude Pro instead of Team for solo users. Potential savings: ₹1,000+/mo = ₹12,000+/year!",
  "what's the catch":
    "🎁 No catch — it's completely free! Credex is a spend intelligence platform for Indian startups. We make money when companies use Credex to manage their AI budgets at scale. The audit is our way of proving our value upfront. No signup required, no credit card, just insights.",
  "cursor vs copilot":
    "⚔️ Both are AI coding assistants but differ: **Cursor** (₹1,700/mo) — standalone editor, GPT-4 + Claude, better for deep AI-pair programming. **GitHub Copilot** (₹850/mo) — IDE plugin (VS Code, JetBrains), better GitHub integration. For teams already on GitHub Enterprise, Copilot is the no-brainer. For startups wanting the best raw AI coding experience, Cursor wins.",
  "talk to a human":
    "👋 Of course! Drop your email and our team at Credex will reach out within 24 hours to discuss your AI spend optimization personally. Or email us directly at hello@credex.rocks",
};

function findFallback(query: string): string | null {
  const lower = query.toLowerCase();
  for (const [key, answer] of Object.entries(FAQ_FALLBACKS)) {
    if (key.split(" ").some((w) => lower.includes(w))) return answer;
  }
  return null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

interface ChatbotProps {
  formContext?: FormContext;
}

export default function Chatbot({ formContext }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") {
      return [
        {
          id: "welcome",
          role: "bot",
          content:
            "👋 Hi! I'm **Saver AI** by Credex. I help engineering teams and founders optimize AI SaaS budgets in ₹. Ask me anything about tool pricing or contract renegotiation!",
          timestamp: new Date(),
        },
      ];
    }

    try {
      const saved = localStorage.getItem("credex-chat-history");
      if (saved) {
        const parsed = JSON.parse(saved) as StoredMessage[];
        return parsed.slice(-6).map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }
    } catch {
      // fallback
    }

    return [
      {
        id: "welcome",
        role: "bot",
        content:
          "👋 Hi! I'm **Saver AI** by Credex. I help engineering teams and founders optimize AI SaaS budgets in ₹. Ask me anything about tool pricing or contract renegotiation!",
        timestamp: new Date(),
      },
    ];
  });

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState("");
  const [proactiveSent, setProactiveSent] = useState(false);
  const selectedAI = useAuditStore((s) => s.selectedAI);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const proactiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("credex-chat-history", JSON.stringify(messages));
      } catch {
        // quota exceeded
      }
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Proactive suggestion after 30s
  useEffect(() => {
    proactiveTimer.current = setTimeout(() => {
      if (!proactiveSent && !isOpen) {
        setProactiveSent(true);
      }
    }, 30000);

    return () => {
      if (proactiveTimer.current) clearTimeout(proactiveTimer.current);
    };
  }, [proactiveSent, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const addMessage = useCallback((role: "user" | "bot", content: string) => {
    const msg: Message = {
      id: Math.random().toString(36).slice(2),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setInputValue("");
      addMessage("user", text);

      // Check for human handoff
      if (
        text.toLowerCase().includes("talk to") ||
        text.toLowerCase().includes("human") ||
        text.toLowerCase().includes("expert")
      ) {
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, 600));
        setIsTyping(false);
        setShowEmailCapture(true);
        addMessage(
          "bot",
          "🙌 Happy to connect you with a Credex spend specialist. Please drop your email below:"
        );
        return;
      }

      // FAQ Fallback
      const fallback = findFallback(text);
      if (fallback) {
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, 700));
        setIsTyping(false);
        addMessage("bot", fallback);
        return;
      }

      // Live AI Request
      setIsTyping(true);
      try {
        const data = await apiFetch<{ message: string }>("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            message: text,
            history: messages.slice(-6).map((m) => ({
              role: m.role === "bot" ? "assistant" : "user",
              content: m.content,
            })),
            formContext,
            selectedAI,
          }),
          showToastOnError: false,
          timeoutMs: 12000,
          retries: 1,
        });

        setIsTyping(false);
        addMessage("bot", data.message || "I couldn't process that response.");
      } catch {
        setIsTyping(false);
        addMessage(
          "bot",
          "💡 I can help with tool comparisons (e.g. Cursor vs Copilot), seat planning, and ₹ pricing breakdowns. What would you like to explore?"
        );
      }
    },
    [messages, formContext, selectedAI, addMessage]
  );

  const handleEmailSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addMessage("bot", "⚠️ Please enter a valid email address.");
      return;
    }

    addMessage("user", email);
    setShowEmailCapture(false);
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsTyping(false);
    addMessage(
      "bot",
      `✅ Confirmed! A Credex advisor will reach out to **${email}** within 24 hours.`
    );
    setEmail("");

    apiFetch("/api/lead", {
      method: "POST",
      body: JSON.stringify({ email, source: "chatbot" }),
      showToastOnError: false,
      timeoutMs: 8000,
    }).catch(() => {});
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem("credex-chat-history");
    } catch {
      // ignore
    }
    setMessages([
      {
        id: "welcome-new",
        role: "bot",
        content: "👋 Hi! I'm **Saver AI** by Credex. How can I assist with your AI budget today?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* Proactive Nudge */}
      {proactiveSent && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="glass-elevated"
          style={{
            position: "fixed",
            bottom: "clamp(76px, 16vw, 96px)",
            right: "clamp(16px, 4vw, 28px)",
            borderRadius: "var(--radius-md)",
            padding: "8px 14px",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontWeight: 600,
            zIndex: 8999,
            maxWidth: 240,
            cursor: "pointer",
          }}
          onClick={() => {
            setIsOpen(true);
            setProactiveSent(false);
          }}
        >
          💡 Need help sizing your AI tools?
          <span style={{ display: "block", fontSize: "11px", color: "var(--accent-primary)", marginTop: 2 }}>
            Ask Saver AI →
          </span>
        </motion.div>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window glass-elevated"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{
              position: "fixed",
              bottom: "clamp(12px, 3vw, 88px)",
              right: "clamp(12px, 3vw, 28px)",
              width: "min(380px, calc(100vw - 24px))",
              height: "min(520px, calc(100dvh - 100px))",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 9000,
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--luxury-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "#FFFFFF",
                  flexShrink: 0,
                }}
              >
                🤖
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Saver AI
                </div>
                <div style={{ fontSize: "10px", color: "var(--status-success)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--status-success)" }} />
                  Online
                </div>
              </div>
              <AISelector />
              <button
                onClick={clearHistory}
                type="button"
                title="Clear history"
                aria-label="Clear chat history"
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: "4px" }}
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                aria-label="Close chat window"
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "4px" }}
              >
                ✕
              </button>
            </div>

            {/* Message Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                  }}
                >
                  <div
                    style={{
                      background: msg.role === "user" ? "var(--accent-primary)" : "var(--bg-card)",
                      color: msg.role === "user" ? "#FFFFFF" : "var(--text-primary)",
                      border: msg.role === "user" ? "none" : "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "8px 12px",
                      fontSize: "13px",
                      lineHeight: 1.45,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>"),
                    }}
                  />
                  <span
                    style={{
                      fontSize: "9px",
                      color: "var(--text-muted)",
                      marginTop: 2,
                      display: "block",
                      textAlign: msg.role === "user" ? "right" : "left",
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  Saver AI is typing...
                </div>
              )}

              {showEmailCapture && (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                    placeholder="you@company.in"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                  <button
                    onClick={handleEmailSubmit}
                    type="button"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--accent-primary)",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 2 && (
              <div
                style={{
                  padding: "6px 10px",
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  borderTop: "1px solid var(--border-subtle)",
                  background: "var(--bg-card)",
                  scrollbarWidth: "none",
                }}
              >
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    type="button"
                    style={{
                      background: "var(--accent-subtle)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "var(--radius-full)",
                      padding: "4px 10px",
                      fontSize: "11px",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input Box */}
            <div
              style={{
                padding: "10px 12px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                gap: 6,
                background: "var(--bg-card)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputValue);
                  }
                }}
                placeholder="Ask about AI savings..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={() => sendMessage(inputValue)}
                type="button"
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent-primary)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Orb Trigger */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        type="button"
        aria-label="Open Saver AI Chat"
        style={{
          position: "fixed",
          bottom: "clamp(16px, 4vw, 28px)",
          right: "clamp(16px, 4vw, 28px)",
          width: "clamp(48px, 12vw, 54px)",
          height: "clamp(48px, 12vw, 54px)",
          borderRadius: "50%",
          background: "var(--luxury-gradient)",
          color: "#FFFFFF",
          border: "none",
          boxShadow: "var(--shadow-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 22,
          zIndex: 8999,
        }}
      >
        {isOpen ? "✕" : "🤖"}
      </button>
    </>
  );
}
