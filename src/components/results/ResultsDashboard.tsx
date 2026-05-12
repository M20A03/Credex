"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditStore } from "@/store/auditStore";
import { formatINR, formatINRShort } from "@/lib/currency";
import type { ToolRecommendation } from "@/lib/audit-engine";

function AnimatedCounter({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(Math.round(easeOut(progress) * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return <span>{formatINRShort(current)}</span>;
}

function SeverityBadge({ severity }: { severity: ToolRecommendation["severity"] }) {
  const labels = { high: "⚡ High Savings", medium: "💡 Optimisable", low: "📌 Minor Tweak", optimal: "✅ Optimal" };
  return <span className={`badge badge-${severity}`}>{labels[severity]}</span>;
}

function ToolCard({ rec, index }: { rec: ToolRecommendation; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 280, damping: 24 }}
      className="glass"
      style={{ borderRadius: 16, overflow: "hidden" }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 16,
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>
              {{ cursor: "🖱️", "github-copilot": "🐙", claude: "🤖", chatgpt: "💬", gemini: "✨", windsurf: "🌊" }[rec.toolId] || "🔧"}
            </span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "rgba(15,23,42,0.95)" }}>
              {rec.toolName}
            </span>
            <SeverityBadge severity={rec.severity} />
          </div>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.5)", display: "flex", gap: 16 }}>
            <span>{rec.currentPlan} → {rec.recommendedPlan}</span>
            {rec.monthlySavings > 0 && (
              <span style={{ color: "#6EE7B7", fontWeight: 600 }}>
                Save {formatINR(rec.monthlySavings)}/mo
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: rec.monthlySavings > 0 ? "#10B981" : "rgba(255,255,255,0.5)" }}>
            {rec.monthlySavings > 0 ? `+${formatINRShort(rec.annualSavings)}/yr` : "✓"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(15,23,42,0.35)", marginTop: 2 }}>
            {rec.monthlySavings > 0 ? "potential saving" : "well optimised"}
          </div>
        </div>

        <span style={{ color: "rgba(15,23,42,0.4)", fontSize: 20, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }}>
          ▾
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 20px", borderTop: "1px solid rgba(15,23,42,0.06)" }}>
              {/* Before / After */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0" }}>
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11, color: "rgba(15,23,42,0.45)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Current</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#FCA5A5" }}>{formatINR(rec.currentCost)}/mo</div>
                  <div style={{ fontSize: 12, color: "rgba(15,23,42,0.4)", marginTop: 2 }}>{rec.currentPlan} plan</div>
                </div>
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11, color: "rgba(15,23,42,0.45)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Recommended</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#6EE7B7" }}>{formatINR(rec.recommendedCost)}/mo</div>
                  <div style={{ fontSize: 12, color: "rgba(15,23,42,0.4)", marginTop: 2 }}>{rec.recommendedPlan} plan</div>
                </div>
              </div>

              {/* Reason */}
              <p style={{ fontSize: 14, color: "rgba(15,23,42,0.6)", lineHeight: 1.6, marginBottom: 12 }}>
                {rec.reason}
              </p>

              {/* Savings bar */}
              {rec.monthlySavings > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(15,23,42,0.45)", marginBottom: 6 }}>
                    <span>Annual savings</span>
                    <span style={{ color: "#6EE7B7", fontWeight: 600 }}>{formatINR(rec.annualSavings)}</span>
                  </div>
                  <div className="savings-bar">
                    <motion.div
                      className="savings-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (rec.monthlySavings / rec.currentCost) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              )}

              {/* Alternative tool */}
              {rec.alternativeTool && (
                <div style={{
                  marginTop: 16,
                  background: "rgba(109,40,217,0.08)",
                  border: "1px solid rgba(109,40,217,0.2)",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(109,40,217,0.9)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    💡 Alternative Tool
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(15,23,42,0.6)" }}>{rec.alternativeTool.reason}</p>
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
  const { result, reset } = useAuditStore();
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSent, setLeadSent] = useState(false);

  if (!result) return null;

  const { totalMonthlySavings, totalAnnualSavings, totalCurrentMonthly, savingsPercentage, recommendations, summaryText } = result;

  const handleLeadSubmit = async () => {
    if (!leadEmail || !leadEmail.includes("@")) return;
    await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: leadEmail, source: "results-modal" }),
    }).catch(() => {});
    setLeadSent(true);
  };

  const handleShare = () => {
    const text = `I just audited my AI tool spend and could save ${formatINRShort(totalAnnualSavings)}/year! Check it out at credex.rocks`;
    if (navigator.share) {
      navigator.share({ title: "Credex AI Spend Audit", text, url: "https://credex.rocks" });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Hero Savings */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="glass"
        style={{ borderRadius: 24, padding: "48px 32px", textAlign: "center", marginBottom: 24, position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.06), transparent 70%)", pointerEvents: "none" }} />

        {totalMonthlySavings > 0 ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(15,23,42,0.4)", marginBottom: 12 }}>
              Potential Annual Savings
            </div>
            <div className="savings-amount gradient-text-savings" style={{ marginBottom: 8 }}>
              <AnimatedCounter target={totalAnnualSavings} duration={2000} />
            </div>
            <div style={{ fontSize: 16, color: "rgba(15,23,42,0.5)", marginBottom: 32 }}>
              That's <strong style={{ color: "rgba(15,23,42,0.8)" }}>{formatINR(totalMonthlySavings)}/month</strong> · {savingsPercentage}% of your current spend
            </div>

            {/* Progress gauge */}
            <div style={{ maxWidth: 400, margin: "0 auto 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(15,23,42,0.4)", marginBottom: 8 }}>
                <span>Current: {formatINRShort(totalCurrentMonthly)}/mo</span>
                <span>Optimised: {formatINRShort(totalCurrentMonthly - totalMonthlySavings)}/mo</span>
              </div>
              <div className="savings-bar" style={{ height: 10 }}>
                <motion.div
                  className="savings-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${savingsPercentage}%` }}
                  transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                />
              </div>
              <div style={{ fontSize: 12, color: "#6EE7B7", textAlign: "right", marginTop: 6, fontWeight: 600 }}>
                {savingsPercentage}% savings opportunity
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>You're spending well!</h2>
            <p style={{ color: "rgba(15,23,42,0.5)" }}>Your AI stack of {formatINRShort(totalCurrentMonthly)}/mo is reasonably optimised.</p>
          </>
        )}

        {/* AI Summary */}
        {summaryText && (
          <div style={{
            background: "rgba(15,23,42,0.03)",
            border: "1px solid rgba(15,23,42,0.06)",
            borderRadius: 14,
            padding: "16px 20px",
            textAlign: "left",
            fontSize: 14,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.65)",
            marginTop: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,23,42,0.35)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ✦ AI Summary
            </span>
            {summaryText}
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowLeadModal(true)}
            className="btn-primary"
            style={{ padding: "14px 28px", borderRadius: 12 }}
          >
            📧 Email Me This Audit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            className="btn-secondary"
            style={{ padding: "14px 28px", borderRadius: 12 }}
          >
            🔗 Share Results
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={reset}
            className="btn-secondary"
            style={{ padding: "14px 28px", borderRadius: 12 }}
          >
            ↩ Start Over
          </motion.button>
        </div>
      </motion.div>

      {/* Tool Breakdown */}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "rgba(15,23,42,0.8)", marginBottom: 16, paddingLeft: 4 }}>
        Per-Tool Breakdown
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {recommendations.map((rec, i) => (
          <ToolCard key={rec.toolId} rec={rec} index={i} />
        ))}
      </div>

      {/* Credex CTA for large savers */}
      {totalMonthlySavings >= 42000 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: "linear-gradient(135deg, rgba(109,40,217,0.2), rgba(37,99,235,0.2))",
            border: "1px solid rgba(109,40,217,0.35)",
            borderRadius: 20,
            padding: "32px",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            🚀 You could save {formatINRShort(totalAnnualSavings)}/year
          </h3>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>
            Credex can help you implement these changes, negotiate enterprise deals, and manage your AI budget end-to-end.
          </p>
          <a
            href="https://credex.rocks"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, textDecoration: "none" }}
          >
            Talk to Credex Expert →
          </a>
        </motion.div>
      )}

      {/* Lead modal */}
      <AnimatePresence>
        {showLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 24 }}
            onClick={() => setShowLeadModal(false)}
          >
            <motion.div
              initial={{ y: 80, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="glass-elevated"
              style={{ borderRadius: 20, padding: 32, maxWidth: 460, width: "100%", marginBottom: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!leadSent ? (
                <>
                  <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Get your full audit report</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24 }}>
                    No spam. Unsubscribe in 1 click. We'll send the full breakdown to your inbox.
                  </p>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLeadSubmit()}
                    placeholder="you@startup.com"
                    className="form-input"
                    style={{ marginBottom: 16 }}
                  />
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={handleLeadSubmit} className="btn-primary" style={{ flex: 1, padding: "14px 24px", borderRadius: 10 }}>
                      Send My Audit →
                    </button>
                    <button onClick={() => setShowLeadModal(false)} className="btn-secondary" style={{ padding: "14px 20px", borderRadius: 10 }}>
                      Cancel
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(15,23,42,0.3)", marginTop: 12, textAlign: "center" }}>
                    🔒 3,247 founders already did this · Zero spam guarantee
                  </p>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Check your inbox!</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                    Your audit is on its way to <strong>{leadEmail}</strong>
                  </p>
                  <button onClick={() => setShowLeadModal(false)} className="btn-secondary" style={{ marginTop: 24, padding: "12px 24px", borderRadius: 10 }}>
                    Close
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
