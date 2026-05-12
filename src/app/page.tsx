"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomCursor from "@/components/effects/CustomCursor";
import Chatbot from "@/components/chatbot/Chatbot";
import SpendForm from "@/components/form/SpendForm";
import ResultsDashboard from "@/components/results/ResultsDashboard";
import ToastContainer from "@/components/ToastContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuditStore } from "@/store/auditStore";

const HERO_TOOLS = [
  { icon: "✍️", name: "Cursor", color: "#6D28D9" },
  { icon: "🐙", name: "Copilot", color: "#2563EB" },
  { icon: "🧠", name: "Claude", color: "#D97706" },
  { icon: "💬", name: "ChatGPT", color: "#10B981" },
  { icon: "🪐", name: "Gemini", color: "#06B6D4" },
  { icon: "🌊", name: "Windsurf", color: "#059669" },
];

export default function HomePage() {
  const { step } = useAuditStore();
  const [mounted, setMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  const heroText = "Stop overpaying for AI tools.";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (charIndex < heroText.length) {
      const t = setTimeout(() => setCharIndex((i) => i + 1), 55);
      return () => clearTimeout(t);
    }
  }, [charIndex, heroText.length]);

  // Hide hero when form is active
  useEffect(() => {
    setHeroVisible(step === "form");
  }, [step]);

  if (!mounted) return null;

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error("Page error:", error);
      }}
    >
      <main style={{ position: "relative", minHeight: "100vh" }}>
        <CustomCursor />
        <ToastContainer />

      {/* ── HERO SECTION ── */}
      <AnimatePresence>
        {heroVisible && step === "form" && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              padding: "80px 24px 40px",
              maxWidth: 900,
              margin: "0 auto",
            }}
          >
            {/* Credex badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(109,40,217,0.12)",
                border: "1px solid rgba(109,40,217,0.3)",
                borderRadius: 999,
                padding: "6px 16px",
                marginBottom: 32,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "0.04em",
              }}
            >
              <span style={{ color: "#6D28D9" }}>✦</span>
              CREDEX · AI SPEND AUDIT
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: "clamp(36px, 6vw, 72px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 20,
              }}
            >
              <span className="gradient-text">
                {heroText.slice(0, charIndex)}
                <span
                  style={{
                    borderRight: "3px solid rgba(109,40,217,0.8)",
                    marginLeft: 2,
                    animation: "cursor-blink 1s step-end infinite",
                  }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "rgba(15,23,42,0.6)",
                maxWidth: 560,
                margin: "0 auto 40px",
                lineHeight: 1.6,
              }}
            >
              Free AI spend audit for Indian startups. Enter your tools, get
              instant ₹ savings recommendations — no signup required.
            </motion.p>

            {/* Orbiting tool icons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {HERO_TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.8 + i * 0.08,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  whileHover={{ scale: 1.15, y: -4 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.85)",
                    border: `1px solid ${tool.color}35`,
                    borderRadius: 10,
                    padding: "6px 12px",
                    fontSize: 13,
                    color: "rgba(15,23,42,0.75)",
                    cursor: "default",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{tool.icon}</span>
                  {tool.name}
                </motion.div>
              ))}
            </motion.div>

            {/* Social proof */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.4 }}
              style={{ fontSize: 13, color: "rgba(15,23,42,0.45)", marginTop: 8 }}
            >
              3,247 founders audited this week · Prices at ₹85/USD
            </motion.p>

            <style>{`
              @keyframes cursor-blink {
                0%,100%{opacity:1} 50%{opacity:0}
              }
            `}</style>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 120px",
        }}
      >
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <SpendForm />
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                gap: 24,
                textAlign: "center",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  border: "3px solid rgba(109,40,217,0.2)",
                  borderTopColor: "#6D28D9",
                }}
              />
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
                  Analysing your AI stack...
                </h2>
                <p style={{ color: "rgba(15,23,42,0.5)", fontSize: 16 }}>
                  Checking for potential savings across your tools
                </p>
              </div>
              {[
                "Comparing plan tiers...",
                "Checking team size optimisation...",
                "Scanning for alternatives...",
                "Calculating ₹ savings...",
              ].map((msg, i) => (
                <motion.p
                  key={msg}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.5 }}
                  style={{ color: "#10B981", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span>✓</span> {msg}
                </motion.p>
              ))}
            </motion.div>
          )}

          {step === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ResultsDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CHATBOT ── */}
      <Chatbot />
      </main>
    </ErrorBoundary>
  );
}
