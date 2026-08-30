"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditStore } from "@/store/auditStore";
import { formatINR, formatINRShort } from "@/lib/currency";
import { useToastStore } from "@/lib/toast-store";
import { apiFetch } from "@/lib/fetcher";
import type { ToolRecommendation } from "@/lib/audit-engine";

function AnimatedCounter({ target, duration = 1600 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(Math.round(easeOut(progress) * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return <span>{formatINRShort(current)}</span>;
}

function SeverityBadge({ severity }: { severity: ToolRecommendation["severity"] }) {
  const labels = {
    high: "⚡ High Savings",
    medium: "💡 Optimisable",
    low: "📌 Minor Tweak",
    optimal: "✅ Optimal",
  };
  return <span className={`badge badge-${severity}`}>{labels[severity]}</span>;
}

function ToolCard({ rec, index }: { rec: ToolRecommendation; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      className="glass"
      style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        type="button"
        aria-expanded={expanded}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "var(--space-5) var(--space-6)",
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: "var(--space-4)",
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>
              {{
                cursor: "🖱️",
                "github-copilot": "🐙",
                claude: "🤖",
                chatgpt: "💬",
                gemini: "✨",
                windsurf: "🌊",
              }[rec.toolId] || "🔧"}
            </span>
            <span style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
              {rec.toolName}
            </span>
            <SeverityBadge severity={rec.severity} />
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", display: "flex", gap: "var(--space-4)" }}>
            <span>
              {rec.currentPlan} → {rec.recommendedPlan}
            </span>
            {rec.monthlySavings > 0 && (
              <span style={{ color: "var(--status-success)", fontWeight: 600 }}>
                Save {formatINR(rec.monthlySavings)}/mo
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 800,
              color: rec.monthlySavings > 0 ? "var(--status-success)" : "var(--text-muted)",
            }}
          >
            {rec.monthlySavings > 0 ? `+${formatINRShort(rec.annualSavings)}/yr` : "✓"}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
            {rec.monthlySavings > 0 ? "potential saving" : "well optimised"}
          </div>
        </div>

        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 18,
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.25s ease",
          }}
        >
          ▾
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 var(--space-6) var(--space-5)", borderTop: "1px solid var(--border-subtle)" }}>
              {/* Cost Comparison Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", margin: "var(--space-4) 0" }}>
                <div
                  style={{
                    background: "var(--status-danger-bg)",
                    border: "1px solid var(--status-danger-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>
                    Current Cost
                  </div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--status-danger)" }}>
                    {formatINR(rec.currentCost)}/mo
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                    {rec.currentPlan} plan
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--status-success-bg)",
                    border: "1px solid var(--status-success-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>
                    Recommended Cost
                  </div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--status-success)" }}>
                    {formatINR(rec.recommendedCost)}/mo
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                    {rec.recommendedPlan} plan
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "var(--space-3)" }}>
                {rec.reason}
              </p>

              {/* Alternative Tool Option */}
              {rec.alternativeTool && (
                <div
                  style={{
                    marginTop: "var(--space-3)",
                    background: "var(--accent-subtle)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--accent-primary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    💡 Alternative Recommendation
                  </div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                    {rec.alternativeTool.reason}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResultsDashboard() {
  const { result, reset, activeFilter, setActiveFilter } = useAuditStore();
  const { addToast } = useToastStore();
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSent, setLeadSent] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLeadModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredRecommendations = useMemo(() => {
    const recs = result?.recommendations || [];
    if (activeFilter === "all") return recs;
    return recs.filter((r) => r.severity === activeFilter);
  }, [result?.recommendations, activeFilter]);

  if (!result) return null;

  const {
    totalMonthlySavings,
    totalAnnualSavings,
    totalCurrentMonthly,
    savingsPercentage,
    summaryText,
  } = result;

  const handleLeadSubmit = async () => {
    if (!leadEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
      addToast({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    try {
      await apiFetch("/api/lead", {
        method: "POST",
        body: JSON.stringify({ email: leadEmail, source: "results-modal" }),
        showToastOnError: true,
      });
      setLeadSent(true);
      addToast({ type: "success", message: "Full executive report sent to your email!" });
    } catch {
      // Toast handled by apiFetch
    }
  };

  const handleShare = () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://credex.rocks";
    const text = `I just audited my AI tool spend on Credex and found ${formatINRShort(totalAnnualSavings)}/year in savings! Check it out: ${shareUrl}`;

    if (navigator.share) {
      navigator.share({ title: "Credex AI Spend Audit", text, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      addToast({ type: "success", message: "🔗 Audit link copied to clipboard!" });
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      {/* Hero Savings Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="glass"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-10) var(--space-8)",
          textAlign: "center",
          marginBottom: "var(--space-6)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {totalMonthlySavings > 0 ? (
          <>
            <div
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "var(--space-2)",
              }}
            >
              Identified Annual Savings
            </div>
            <div
              className="gradient-text-savings"
              style={{
                fontSize: "clamp(42px, 7vw, 68px)",
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: "var(--space-2)",
              }}
            >
              <AnimatedCounter target={totalAnnualSavings} duration={1800} />
            </div>
            <div style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
              That&apos;s <strong style={{ color: "var(--text-primary)" }}>{formatINR(totalMonthlySavings)}/month</strong> · {savingsPercentage}% of current AI budget
            </div>

            {/* Savings Bar Gauge */}
            <div style={{ maxWidth: 440, margin: "0 auto var(--space-6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 6 }}>
                <span>Current: {formatINRShort(totalCurrentMonthly)}/mo</span>
                <span>Optimized: {formatINRShort(totalCurrentMonthly - totalMonthlySavings)}/mo</span>
              </div>
              <div
                style={{
                  height: 10,
                  borderRadius: "var(--radius-full)",
                  background: "var(--accent-subtle)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${savingsPercentage}%` }}
                  transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{
                    height: "100%",
                    background: "var(--savings-gradient)",
                    borderRadius: "var(--radius-full)",
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: "var(--space-6) 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              Your Stack Is Lean & Well-Optimized!
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-base)" }}>
              Current AI tool investment of {formatINRShort(totalCurrentMonthly)}/mo matches recommended tier limits.
            </p>
          </div>
        )}

        {/* AI Summary Card */}
        {summaryText && (
          <div
            style={{
              background: "var(--accent-subtle)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              padding: "18px 22px",
              textAlign: "left",
              fontSize: "var(--text-sm)",
              lineHeight: 1.65,
              color: "var(--text-secondary)",
              marginTop: "var(--space-4)",
            }}
          >
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                color: "var(--accent-primary)",
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ✦ AI Spend Advisor Note
            </span>
            {summaryText}
          </div>
        )}

        {/* Action CTAs */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "var(--space-6)",
          }}
        >
          <button
            onClick={() => setShowLeadModal(true)}
            type="button"
            style={{
              padding: "12px 24px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-primary)",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "var(--text-sm)",
              border: "none",
              cursor: "pointer",
            }}
          >
            📧 Email Me This Audit
          </button>
          <button
            onClick={handleShare}
            type="button"
            style={{
              padding: "12px 24px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: "var(--text-sm)",
              border: "1px solid var(--border-strong)",
              cursor: "pointer",
            }}
          >
            🔗 Share Results
          </button>
          <button
            onClick={reset}
            type="button"
            style={{
              padding: "12px 24px",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              color: "var(--text-muted)",
              fontWeight: 600,
              fontSize: "var(--text-sm)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
            }}
          >
            ↩ New Audit
          </button>
        </div>
      </motion.div>

      {/* Filter Tabs & Per-Tool Breakdown */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)" }}>
          Per-Tool Recommendations ({filteredRecommendations.length})
        </h3>

        {/* Filter Badges */}
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {(["all", "high", "medium", "optimal"] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              type="button"
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: activeFilter === filterKey ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeFilter === filterKey ? "#FFFFFF" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              {filterKey.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
        {filteredRecommendations.map((rec, i) => (
          <ToolCard key={rec.toolId} rec={rec} index={i} />
        ))}
      </div>

      {/* Lead Capture Modal */}
      <AnimatePresence>
        {showLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.65)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-4)",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setShowLeadModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ y: 40, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="glass-elevated"
              style={{
                borderRadius: "var(--radius-xl)",
                padding: "var(--space-8)",
                maxWidth: 480,
                width: "100%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {!leadSent ? (
                <>
                  <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                    Receive Full PDF Executive Report
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-5)" }}>
                    We&apos;ll email you this complete savings breakdown along with contract renegotiation templates.
                  </p>

                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLeadSubmit()}
                    placeholder="founder@startup.in"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      fontSize: "var(--text-base)",
                      marginBottom: "var(--space-4)",
                    }}
                  />

                  <div style={{ display: "flex", gap: "var(--space-3)" }}>
                    <button
                      onClick={handleLeadSubmit}
                      type="button"
                      style={{
                        flex: 1,
                        padding: "12px 20px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--accent-primary)",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Send Executive Report →
                    </button>
                    <button
                      onClick={() => setShowLeadModal(false)}
                      type="button"
                      style={{
                        padding: "12px 18px",
                        borderRadius: "var(--radius-md)",
                        background: "transparent",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
                    Report Dispatched!
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                    Your audit is flying to <strong>{leadEmail}</strong>.
                  </p>
                  <button
                    onClick={() => setShowLeadModal(false)}
                    type="button"
                    style={{
                      marginTop: "var(--space-5)",
                      padding: "10px 24px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--accent-primary)",
                      color: "#FFFFFF",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
