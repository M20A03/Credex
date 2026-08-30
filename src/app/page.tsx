"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Chatbot from "@/components/chatbot/Chatbot";
import SpendForm from "@/components/form/SpendForm";
import SpendFormSkeleton from "@/components/form/SpendFormSkeleton";
import ResultsDashboard from "@/components/results/ResultsDashboard";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuditStore } from "@/store/auditStore";
import { useMounted } from "@/lib/use-mounted";

const HERO_TOOLS = [
  { icon: "✍️", name: "Cursor", color: "#6D28D9" },
  { icon: "🐙", name: "Copilot", color: "#2563EB" },
  { icon: "🧠", name: "Claude", color: "#D97706" },
  { icon: "💬", name: "ChatGPT", color: "#10B981" },
  { icon: "🪐", name: "Gemini", color: "#06B6D4" },
  { icon: "🌊", name: "Windsurf", color: "#059669" },
];

function HomeContent() {
  const { step, setStep } = useAuditStore();
  const mounted = useMounted();
  const [charIndex, setCharIndex] = useState(0);

  const heroText = "Stop overpaying for AI tools.";

  // Sync from URL query params once mounted
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step");
      if (urlStep === "form" || urlStep === "results") {
        setStep(urlStep);
      }
    }
  }, [setStep]);

  // Typewriter effect
  useEffect(() => {
    if (charIndex < heroText.length) {
      const timer = setTimeout(() => setCharIndex((i) => i + 1), 50);
      return () => clearTimeout(timer);
    }
  }, [charIndex, heroText.length]);

  if (!mounted) {
    return (
      <main style={{ minHeight: "100vh", padding: "80px 24px" }}>
        <SpendFormSkeleton />
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main style={{ position: "relative", minHeight: "100vh" }}>
        {/* Top Floating Navigation Bar with Theme Toggle */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "12px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--luxury-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                C
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                CREDEX
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* ── HERO SECTION ── */}
        <AnimatePresence>
          {step === "form" && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                padding: "60px 24px 32px",
                maxWidth: 900,
                margin: "0 auto",
              }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--accent-subtle)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "var(--radius-full)",
                  padding: "6px 16px",
                  marginBottom: 28,
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "0.04em",
                }}
              >
                <span style={{ color: "var(--accent-primary)" }}>✦</span>
                CREDEX · AI SPEND AUDIT & SRE ENGINE
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(34px, 5.5vw, 64px)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  marginBottom: 16,
                }}
              >
                <span className="gradient-text">
                  {heroText.slice(0, charIndex)}
                  <span
                    style={{
                      borderRight: "3px solid var(--accent-primary)",
                      marginLeft: 2,
                      animation: "cursor-blink 1s step-end infinite",
                    }}
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontSize: "clamp(15px, 2vw, 19px)",
                  color: "var(--text-secondary)",
                  maxWidth: 580,
                  margin: "0 auto 36px",
                  lineHeight: 1.6,
                }}
              >
                Free AI spend audit for engineering teams & Indian startups. Enter your tools, get
                instant ₹ savings recommendations — no credit card needed.
              </motion.p>

              {/* Orbiting tool icons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {HERO_TOOLS.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.7 + i * 0.06,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    whileHover={{ scale: 1.1, y: -3 }}
                    className="glass"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: "var(--radius-sm)",
                      padding: "6px 12px",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{tool.icon}</span>
                    {tool.name}
                  </motion.div>
                ))}
              </motion.div>

              <style>{`
                @keyframes cursor-blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
              `}</style>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── MAIN CONTENT CONTAINER ── */}
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
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
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
                  minHeight: "50vh",
                  gap: 24,
                  textAlign: "center",
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    border: "3px solid var(--border-subtle)",
                    borderTopColor: "var(--accent-primary)",
                  }}
                />
                <div>
                  <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    Analysing your AI subscriptions...
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                    Comparing plan tiers and team seat utilization
                  </p>
                </div>
              </motion.div>
            )}

            {step === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
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

export default function HomePage() {
  return (
    <Suspense fallback={<SpendFormSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
