"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AISelector from "@/components/chatbot/AISelector";
import { useAuditStore } from "@/store/auditStore";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
};

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState("");
  const [proactiveSent, setProactiveSent] = useState(false);
  const selectedAI = useAuditStore((s) => s.selectedAI);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const proactiveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("credex-chat-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Show last 3 messages
        setMessages(
          parsed.slice(-3).map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } else {
        // Welcome message
        setMessages([
          {
            id: "welcome",
            role: "bot",
            content:
              "👋 Hi! I'm **Saver AI** by Credex. I help Indian startups stop overpaying for AI tools. Ask me anything about your audit, pricing in ₹, or comparisons!",
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("credex-chat-history", JSON.stringify(messages));
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
        // Show badge/nudge
      }
    }, 30000);
    return () => clearTimeout(proactiveTimer.current);
  }, [proactiveSent, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
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
        await new Promise((r) => setTimeout(r, 800));
        setIsTyping(false);
        setShowEmailCapture(true);
        addMessage(
          "bot",
          "🙌 Happy to connect you with a Credex expert! They can help you implement these optimizations and manage your entire AI budget. Please share your email:"
        );
        return;
      }

      // Try FAQ fallback first (instant)
      const fallback = findFallback(text);
      if (fallback) {
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
        setIsTyping(false);
        addMessage("bot", fallback);
        return;
      }

      // Try Claude API
      setIsTyping(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-6).map((m) => ({
              role: m.role === "bot" ? "assistant" : "user",
              content: m.content,
            })),
            formContext,
            selectedAI,
          }),
        });

        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        setIsTyping(false);
        addMessage("bot", data.message || "I couldn't process that. Try asking something else!");
      } catch {
        setIsTyping(false);
        addMessage(
          "bot",
          "💡 Great question! For detailed guidance, try asking: 'How do savings work?', 'Compare Cursor vs Copilot', or 'Show me an example audit'. I'm here to help!"
        );
      }
    },
    [messages, formContext, addMessage]
  );

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    addMessage("user", email);
    setShowEmailCapture(false);
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsTyping(false);
    addMessage(
      "bot",
      `✅ Got it! A Credex expert will reach out to **${email}** within 24 hours. In the meantime, complete your audit above for a personalized recommendation!`
    );
    setEmail("");

    // Fire lead capture
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "chatbot" }),
      });
    } catch {
      // silent fail
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("credex-chat-history");
    setMessages([
      {
        id: "welcome-new",
        role: "bot",
        content: "👋 Hi! I'm **Saver AI** by Credex. How can I help optimize your AI spend today?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* Proactive nudge badge */}
      {proactiveSent && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            bottom: 104,
            right: 28,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(109,40,217,0.2)",
            borderRadius: 12,
            padding: "10px 16px",
            color: "rgba(15,23,42,0.85)",
            fontSize: 13,
            fontWeight: 500,
            zIndex: 8999,
            maxWidth: 220,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(15,23,42,0.1)",
          }}
          onClick={() => {
            setIsOpen(true);
            setProactiveSent(false);
          }}
        >
          💡 Need help optimizing your AI spend?
          <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
            Click to chat with Saver AI →
          </span>
        </motion.div>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window glass"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(109,40,217,0.1)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#6D28D9,#2563EB)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                🤖
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "rgba(15,23,42,0.9)" }}>
                  Saver AI
                </div>
                <div style={{ fontSize: 11, color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#10B981",
                      display: "inline-block",
                    }}
                  />
                  Online · by Credex
                </div>
              </div>
              <AISelector />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={clearHistory}
                  title="Clear history"
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(15,23,42,0.4)",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: 4,
                    lineHeight: 1,
                  }}
                >
                  🗑️
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(15,23,42,0.5)",
                    cursor: "pointer",
                    fontSize: 18,
                    padding: 4,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    className={`message-bubble ${msg.role}`}
                    style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br/>"),
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(15,23,42,0.3)",
                      marginTop: 2,
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      padding: "0 4px",
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="message-bubble bot" style={{ alignSelf: "flex-start", padding: "12px 16px" }}>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              {/* Email capture */}
              {showEmailCapture && (
                <div style={{ display: "flex", gap: 8, padding: "4px 0" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                    placeholder="you@company.com"
                    className="form-input"
                    style={{ flex: 1, fontSize: 13, padding: "8px 12px", minHeight: 40 }}
                  />
                  <button
                    onClick={handleEmailSubmit}
                    className="btn-primary"
                    style={{ padding: "8px 16px", fontSize: 13 }}
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
                  padding: "8px 16px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    className="quick-reply-chip"
                    onClick={() => sendMessage(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                gap: 8,
                background: "rgba(0,0,0,0.2)",
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
                placeholder="Ask about your AI spend..."
                className="form-input"
                style={{ flex: 1, fontSize: 14, padding: "10px 14px", minHeight: 44 }}
              />
              <button
                onClick={() => sendMessage(inputValue)}
                className="btn-primary"
                style={{ padding: "10px 16px", minHeight: 44, fontSize: 18, lineHeight: 1 }}
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Orb */}
      <div className="chat-orb" onClick={() => setIsOpen((o) => !o)}>
        <div className="chat-orb-pulse" />
        <div className="chat-orb-pulse-2" />
        <motion.div
          className="chat-orb-circle"
          whileTap={{ scale: 0.92 }}
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <span style={{ fontSize: 26 }}>{isOpen ? "✕" : "🤖"}</span>
        </motion.div>
        {!isOpen && proactiveSent && (
          <div
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#EF4444",
              border: "2px solid #0A0A0F",
              animation: "orb-pulse 1.5s ease-out infinite",
            }}
          />
        )}
      </div>
    </>
  );
}
