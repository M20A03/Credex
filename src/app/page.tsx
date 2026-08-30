"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SpendForm from "@/components/form/SpendForm";
import ResultsDashboard from "@/components/results/ResultsDashboard";
import Chatbot from "@/components/chatbot/Chatbot";
import CustomCursor from "@/components/effects/CustomCursor";
import ThemeToggle from "@/components/theme/ThemeToggle";
import CurrencyToggle from "@/components/CurrencyToggle";
import ToolComparisonMatrix from "@/components/ToolComparisonMatrix";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ToastContainer from "@/components/ToastContainer";
import SpendFormSkeleton from "@/components/form/SpendFormSkeleton";
import { useAuditStore } from "@/store/auditStore";

function AuditApp() {
  const { step, setStep, tools, teamSize, result } = useAuditStore();
  const searchParams = useSearchParams();

  // Sync step from query parameters
  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam === "results" && result) {
      setStep("results");
    } else if (stepParam === "form") {
      setStep("form");
    }
  }, [searchParams, result, setStep]);

  // Sync URL with step changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (step === "results" && result) {
        url.searchParams.set("step", "results");
      } else {
        url.searchParams.delete("step");
      }
      window.history.replaceState({}, "", url.toString());
    }
  }, [step, result]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", zIndex: 1 }}>
      {/* Background Liquid Aurora Blobs */}
      <div className="liquid-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>

      <CustomCursor />
      <ToastContainer />

      {/* Top Floating Glass Header */}
      <header
        style={{
          position: "sticky",
          top: 16,
          zIndex: 100,
          maxWidth: 1140,
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        <div
          className="glass-elevated"
          style={{
            borderRadius: "var(--radius-full)",
            padding: "10px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--luxury-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "#FFFFFF",
                fontSize: "16px",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              C
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: "var(--text-base)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                CREDEX
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "var(--accent-primary)",
                  marginLeft: "6px",
                  background: "var(--accent-subtle)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                SPEND INTELLIGENCE
              </span>
            </div>
          </div>

          {/* Social Proof Pill */}
          <div
            style={{
              display: "none",
              alignItems: "center",
              gap: "6px",
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
            className="md:flex"
          >
            <span style={{ color: "var(--status-success)" }}>●</span> 500+ Indian Startups Audited
          </div>

          {/* Controls: Currency + Theme */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CurrencyToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Hero Banner (Only shown on form step) */}
        {step === "form" && (
          <section style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent-subtle)",
                border: "1px solid var(--border-strong)",
                fontSize: "var(--text-xs)",
                fontWeight: 800,
                color: "var(--accent-primary)",
                marginBottom: "18px",
              }}
            >
              <span>⚡</span> 2026 AI SOFTWARE SPEND OPTIMIZER FOR INDIAN TECH
            </div>

            <h1
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                fontWeight: 900,
                lineHeight: 1.12,
                letterSpacing: "-0.03em",
                maxWidth: "860px",
                margin: "0 auto 16px",
              }}
            >
              Stop Overpaying For <span className="gradient-text">AI Developer Tools</span>
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 2vw, 1.25rem)",
                color: "var(--text-secondary)",
                maxWidth: "680px",
                margin: "0 auto 28px",
                lineHeight: 1.6,
              }}
            >
              Instant audit for Indian engineering teams & startups. Right-size your seats across Cursor,
              Copilot, Claude, ChatGPT, Windsurf, and Gemini in ₹ INR or $ USD.
            </p>

            {/* Quick Stat Highlights */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "24px",
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              <div>💰 Average Savings: <strong style={{ color: "var(--status-success)" }}>₹1.4L+ / year</strong></div>
              <div>⚡ Audit Speed: <strong style={{ color: "var(--text-primary)" }}>&lt; 5 Seconds</strong></div>
              <div>🔒 Privacy: <strong style={{ color: "var(--text-primary)" }}>No Bank Login / No Cards</strong></div>
            </div>
          </section>
        )}

        <ErrorBoundary
          fallback={(_err, reset) => (
            <div className="glass" style={{ textAlign: "center", padding: "40px", borderRadius: "var(--radius-xl)" }}>
              <p style={{ color: "var(--status-danger)", fontWeight: 700 }}>Something interrupted the audit view.</p>
              <button
                onClick={reset}
                style={{
                  marginTop: "12px",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent-primary)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ↻ Retry
              </button>
            </div>
          )}
        >
          {step === "form" ? <SpendForm /> : <ResultsDashboard />}
        </ErrorBoundary>

        {/* Tool Comparison Matrix */}
        <ToolComparisonMatrix />

        {/* FAQ & Enterprise Assurance */}
        <section
          style={{
            marginTop: "64px",
            paddingTop: "40px",
            borderTop: "1px solid var(--border-subtle)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "8px" }}>
            CREDEX AI BUDGET AUDIT PLATFORM · HELLO@CREDEX.ROCKS
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Built for engineering leaders, CTOs, and founders cutting cloud & AI subscription bloat.
          </div>
        </section>
      </main>

      {/* Floating Saver AI Chatbot */}
      <Chatbot formContext={{ tools, teamSize }} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<SpendFormSkeleton />}>
      <AuditApp />
    </Suspense>
  );
}
