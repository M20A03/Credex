"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useAuditStore } from "@/store/auditStore";
import { formatCurrency, formatCurrencyShort } from "@/lib/currency";
import { apiFetch } from "@/lib/fetcher";
import { useToastStore } from "@/lib/toast-store";
import { useMounted } from "@/lib/use-mounted";

const CHART_COLORS = ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#6366F1"];

function getWindowDimensionsSnapshot() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function getWindowDimensionsServerSnapshot() {
  return { width: 1200, height: 800 };
}

function subscribeWindowResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export default function ResultsDashboard() {
  const { result, setStep, currency } = useAuditStore();
  const addToast = useToastStore((s) => s.addToast);
  const isMounted = useMounted();

  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "optimal">("all");
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [isSendingLead, setIsSendingLead] = useState(false);

  const windowDimensions = useSyncExternalStore(
    subscribeWindowResize,
    getWindowDimensionsSnapshot,
    getWindowDimensionsServerSnapshot
  );

  const filteredRecommendations = useMemo(() => {
    const recs = result?.recommendations || [];
    if (activeFilter === "all") return recs;
    return recs.filter((r) => r.severity === activeFilter);
  }, [result?.recommendations, activeFilter]);

  const pieData = useMemo(() => {
    if (!result) return [];
    return result.recommendations.map((r, index) => ({
      name: r.toolName,
      value: r.currentCost,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [result]);

  const barData = useMemo(() => {
    if (!result) return [];
    return [
      {
        name: "Monthly AI Spend",
        Current: result.totalCurrentMonthly,
        Optimized: result.totalOptimizedMonthly,
      },
    ];
  }, [result]);

  if (!result) return null;

  const {
    totalMonthlySavings,
    totalAnnualSavings,
    totalCurrentMonthly,
    totalOptimizedMonthly,
    savingsPercentage,
    summaryText,
  } = result;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      addToast({ type: "success", message: "🔗 Audit link copied to clipboard!" });
    }
  };

  const { riskScore, riskClassification, riskColor, overlapCount } = useMemo(() => {
    if (!result) return { riskScore: 20, riskClassification: "Lean & Optimized", riskColor: "#10B981", overlapCount: 0 };
    const recs = result.recommendations;
    const highRecs = recs.filter((r) => r.severity === "high").length;
    
    const score = Math.round(Math.min(96, Math.max(18, result.savingsPercentage * 1.4 + highRecs * 12)));
    let classification = "Lean Stack";
    let color = "#10B981"; // Emerald

    if (score >= 65) {
      classification = "Critical Stack Bloat";
      color = "#EF4444"; // Red
    } else if (score >= 38) {
      classification = "Moderate Overspend Risk";
      color = "#F59E0B"; // Amber
    }

    return {
      riskScore: score,
      riskClassification: classification,
      riskColor: color,
      overlapCount: highRecs,
    };
  }, [result]);

  const handleExportDossier = () => {
    if (!result) return;
    const dossierMarkdown = `# CREDEX EXECUTIVE AI SPEND & RISK DOSSIER (2026)
--------------------------------------------------------------------------------
Audit ID: ${result.id}
Generated: ${new Date().toLocaleString()}
Currency: ${currency}
Compliant with Enterprise FinOps & SOC2 Benchmarks
--------------------------------------------------------------------------------

## 1. FINANCIAL EXECUTIVE SUMMARY
- Current Monthly AI Tool Spend: ${formatCurrency(totalCurrentMonthly, currency)}
- Optimized Target Spend: ${formatCurrency(totalOptimizedMonthly, currency)}
- Monthly Recoverable Cash: ${formatCurrency(totalMonthlySavings, currency)}
- Annualized Run-Rate Recovery: ${formatCurrency(totalAnnualSavings, currency)}
- Efficiency & Savings ROI: ${savingsPercentage}%

## 2. RISK ANALYSIS & REDUNDANCY METRICS
- Overspend & Inefficiency Risk Score: ${riskScore} / 100 (${riskClassification})
- Redundant Tool Overlaps: ${overlapCount} overlapping code/chat assistants detected.
- Recommendation: Right-size seat tiers and eliminate secondary co-pilots.

## 3. TOOL-BY-TOOL AUDIT & ACTION MATRIX
${result.recommendations
  .map(
    (rec) => `
### ${rec.toolName} [${rec.severity.toUpperCase()} PRIORITY]
- Current Plan: ${rec.currentPlan} @ ${formatCurrency(rec.currentCost, currency)}/mo
- Recommended Plan: ${rec.recommendedPlan} @ ${formatCurrency(rec.recommendedCost, currency)}/mo
- Monthly Net Savings: ${formatCurrency(rec.monthlySavings, currency)}
- Annual Net Savings: ${formatCurrency(rec.annualSavings, currency)}
- Actionable Rationale: ${rec.reason}
${rec.alternativeTool ? `- Alternative Migration: ${rec.alternativeTool.name} (${rec.alternativeTool.plan}) - ${rec.alternativeTool.reason}` : ""}
`
  )
  .join("\n")}

--------------------------------------------------------------------------------
Generated by CREDEX AI Spend Architecture Platform
Support: hello@credex.rocks
`;

    const blob = new Blob([dossierMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CREDEX-AUDIT-DOSSIER-${(result.id || "2026").slice(0, 8)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: "success",
      message: `📁 Executive Audit Dossier [CREDEX-DOSSIER.md] downloaded!`,
    });
  };

  const handleLeadSubmit = async () => {
    if (!leadEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
      addToast({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setIsSendingLead(true);
    try {
      await apiFetch("/api/lead", {
        method: "POST",
        body: JSON.stringify({
          email: leadEmail,
          auditId: result.id,
          monthlySavings: totalMonthlySavings,
          annualSavings: totalAnnualSavings,
          source: "results_export_modal",
        }),
        timeoutMs: 10000,
        showToastOnError: false,
      });

      addToast({
        type: "success",
        message: `📄 Full PDF audit memo dispatched to ${leadEmail}!`,
      });
      setShowLeadModal(false);
      setLeadEmail("");
    } catch {
      addToast({
        type: "error",
        message: "Unable to dispatch email. Please try again.",
      });
    } finally {
      setIsSendingLead(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", width: "100%", paddingBottom: "60px" }}>
      {/* Confetti on positive savings */}
      {isMounted && totalMonthlySavings > 0 && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={160}
          gravity={0.18}
        />
      )}

      {/* Hero Savings Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-elevated"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "clamp(20px, 4vw, 36px) clamp(14px, 3.5vw, 36px)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          border: "1px solid var(--border-glow)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: "4px",
            background: "var(--luxury-gradient)",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 14px",
            borderRadius: "var(--radius-full)",
            background: "var(--status-success-bg)",
            border: "1px solid var(--status-success-border)",
            color: "var(--status-success)",
            fontSize: "clamp(10px, 2.5vw, 12px)",
            fontWeight: 800,
            letterSpacing: "0.04em",
            marginBottom: "14px",
          }}
        >
          <span>✨</span> AUDIT COMPLETE
        </div>

        <h1 style={{ fontSize: "clamp(1.5rem, 5.2vw, 3.2rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: "8px" }}>
          Potential Annual Savings:{" "}
          <span className="gradient-text-savings">{formatCurrencyShort(totalAnnualSavings, currency)}</span>
        </h1>

        <p style={{ fontSize: "clamp(13px, 2.8vw, 16px)", color: "var(--text-secondary)", maxWidth: "680px", margin: "0 auto 20px" }}>
          {summaryText}
        </p>

        {/* 4 Stat Cards (2x2 on phones, 4x1 on desktop) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <div
            className="glass"
            style={{ padding: "14px 10px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}
          >
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Monthly Savings
            </div>
            <div style={{ fontSize: "clamp(16px, 3.5vw, 22px)", fontWeight: 900, color: "var(--status-success)", marginTop: "4px" }}>
              {formatCurrency(totalMonthlySavings, currency)}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>/ mo recovered</div>
          </div>

          <div
            className="glass"
            style={{ padding: "14px 10px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}
          >
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Savings ROI
            </div>
            <div style={{ fontSize: "clamp(16px, 3.5vw, 22px)", fontWeight: 900, color: "var(--accent-primary)", marginTop: "4px" }}>
              {savingsPercentage}%
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>budget saved</div>
          </div>

          <div
            className="glass"
            style={{ padding: "14px 10px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}
          >
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Current Spend
            </div>
            <div style={{ fontSize: "clamp(16px, 3.5vw, 22px)", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
              {formatCurrency(totalCurrentMonthly, currency)}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>/ mo before</div>
          </div>

          <div
            className="glass"
            style={{ padding: "14px 10px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}
          >
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Optimized Spend
            </div>
            <div style={{ fontSize: "clamp(16px, 3.5vw, 22px)", fontWeight: 800, color: "var(--accent-cyan)", marginTop: "4px" }}>
              {formatCurrency(totalOptimizedMonthly, currency)}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>/ mo target</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "center",
            marginTop: "24px",
          }}
        >
          <button
            onClick={handleExportDossier}
            type="button"
            className="rotating-border"
            style={{
              padding: "10px 18px",
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
            }}
          >
            <span>📁</span>
            <span>Export Audit Dossier (.md)</span>
          </button>

          <button
            onClick={() => setShowLeadModal(true)}
            type="button"
            className="glass"
            style={{
              padding: "10px 18px",
              borderRadius: "var(--radius-full)",
              color: "var(--text-primary)",
              fontWeight: 800,
              fontSize: "13px",
              border: "1px solid var(--border-strong)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📧</span>
            <span>Get PDF Memo</span>
          </button>

          <button
            onClick={() => window.print()}
            type="button"
            className="glass"
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-full)",
              color: "var(--text-primary)",
              fontWeight: 700,
              fontSize: "13px",
              border: "1px solid var(--border-strong)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🖨️</span>
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleCopyLink}
            type="button"
            className="glass"
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-full)",
              color: "var(--text-primary)",
              fontWeight: 700,
              fontSize: "13px",
              border: "1px solid var(--border-strong)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🔗</span>
            <span>Share Link</span>
          </button>

          <button
            onClick={() => setStep("form")}
            type="button"
            className="glass"
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-full)",
              color: "var(--text-muted)",
              fontWeight: 700,
              fontSize: "13px",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
            }}
          >
            🔄 Edit Stack
          </button>
        </div>
      </motion.div>

      {/* Animated SVG Radial Risk & Overspend Gauge */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-elevated"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "clamp(18px, 3.5vw, 28px)",
          marginTop: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🛡️</span>
              <span>Overspend & Liquidity Risk Gauge</span>
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Dynamic risk index evaluating redundant seat tiers, overlap coefficient, and annual cash leak.
            </p>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: riskColor,
              background: `rgba(${riskScore >= 65 ? "239, 68, 68" : riskScore >= 38 ? "245, 158, 11" : "16, 185, 129"}, 0.12)`,
              border: `1px solid ${riskColor}`,
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
            }}
          >
            {riskClassification.toUpperCase()}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "20px",
            alignItems: "center",
          }}
        >
          {/* SVG Radial Meter */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <svg width="160" height="160" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="credexRiskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
              {/* Background Track */}
              <circle
                cx="70"
                cy="70"
                r="52"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="11"
              />
              {/* Animated Progress Ring */}
              <motion.circle
                cx="70"
                cy="70"
                r="52"
                fill="none"
                stroke="url(#credexRiskGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray="326.73"
                initial={{ strokeDashoffset: 326.73 }}
                animate={{ strokeDashoffset: 326.73 - (326.73 * riskScore) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
                {riskScore}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
                RISK / 100
              </span>
            </div>
          </div>

          {/* 3 Telemetry Diagnostic Breakdown Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="glass" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                ⚡ Redundant AI Assistants
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>
                {overlapCount > 0 ? `${overlapCount} overlapping code tools detected` : "Lean, non-duplicated stack"}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {overlapCount > 0 ? "Multiple subscriptions doing identical code completion." : "No duplicate seats across developers."}
              </div>
            </div>

            <div className="glass" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                📉 Recoverable Burn Rate
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--status-success)", marginTop: "2px" }}>
                {formatCurrency(totalMonthlySavings, currency)} / month
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                Equals {formatCurrencyShort(totalAnnualSavings, currency)} in runway extension over 12 months.
              </div>
            </div>

            <div className="glass" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                🛡️ Enterprise Governance
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent-cyan)", marginTop: "2px" }}>
                SOC2 & Zero-Data-Retention Ready
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                All recommended plans preserve private code training opt-outs.
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visual Charts Grid */}
      {isMounted && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {/* Spend Breakdown Donut */}
          <div
            className="glass"
            style={{
              borderRadius: "var(--radius-xl)",
              padding: "clamp(16px, 3vw, 24px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
              Spend Allocation by Tool
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px" }}>
              Where your engineering budget currently flows
            </p>

            <div style={{ height: "220px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0, currency), "Current Spend"]}
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Before vs After Bar Chart */}
          <div
            className="glass"
            style={{
              borderRadius: "var(--radius-xl)",
              padding: "clamp(16px, 3vw, 24px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
              Before vs After Optimization
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px" }}>
              Current monthly spend vs right-sized tier cost
            </p>

            <div style={{ height: "220px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickFormatter={(val) => formatCurrencyShort(Number(val), currency)}
                  />
                  <RechartsTooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0, currency), ""]}
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="Current" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Optimized" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "30px",
          marginBottom: "14px",
        }}
      >
        <h2 style={{ fontSize: "clamp(16px, 3.5vw, 20px)", fontWeight: 800, color: "var(--text-primary)" }}>
          Detailed Tool Recommendations ({result.recommendations.length})
        </h2>

        <div
          className="glass"
          style={{
            display: "flex",
            gap: "4px",
            padding: "3px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border-subtle)",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {(["all", "high", "medium", "optimal"] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              type="button"
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                background: activeFilter === filterKey ? "var(--accent-primary)" : "transparent",
                color: activeFilter === filterKey ? "#FFFFFF" : "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {filterKey === "all" ? "All Tools" : filterKey}
            </button>
          ))}
        </div>
      </div>

      {/* Tool Recommendations List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredRecommendations.map((rec) => (
          <motion.div
            key={rec.toolId}
            whileHover={{ y: -2 }}
            className="glass"
            style={{
              borderRadius: "var(--radius-xl)",
              padding: "clamp(16px, 3vw, 24px) clamp(14px, 3vw, 28px)",
              border:
                rec.severity === "high"
                  ? "1px solid var(--status-danger-border)"
                  : "1px solid var(--border-subtle)",
            }}
          >
            {/* Top Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ fontSize: "24px" }}>🔧</div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>
                    {rec.toolName}
                  </h3>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Current: <strong style={{ color: "var(--text-primary)" }}>{rec.currentPlan}</strong> →
                    Recommended: <strong style={{ color: "var(--status-success)" }}>{rec.recommendedPlan}</strong>
                  </div>
                </div>
              </div>

              {/* Badge & Savings */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    background:
                      rec.severity === "high"
                        ? "var(--status-danger-bg)"
                        : rec.severity === "medium"
                        ? "var(--status-warning-bg)"
                        : "var(--status-success-bg)",
                    color:
                      rec.severity === "high"
                        ? "var(--status-danger)"
                        : rec.severity === "medium"
                        ? "var(--status-warning)"
                        : "var(--status-success)",
                    border: `1px solid ${
                      rec.severity === "high"
                        ? "var(--status-danger-border)"
                        : rec.severity === "medium"
                        ? "var(--status-warning-border)"
                        : "var(--status-success-border)"
                    }`,
                  }}
                >
                  {rec.severity === "high"
                    ? "Over-Provisioned"
                    : rec.severity === "medium"
                    ? "Downgrade"
                    : "Optimal"}
                </span>

                {rec.monthlySavings > 0 ? (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "var(--status-success)" }}>
                      +{formatCurrency(rec.monthlySavings, currency)}/mo
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                      ({formatCurrencyShort(rec.annualSavings, currency)}/yr saved)
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--status-success)" }}>
                    Optimal
                  </div>
                )}
              </div>
            </div>

            {/* Rationale Text */}
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              {rec.reason}
            </p>

            {/* Alternative Tool Recommendation */}
            {rec.alternativeTool && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent-subtle)",
                  border: "1px solid var(--border-strong)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "18px" }}>💡</span>
                <div style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--accent-primary)" }}>
                    Alternative Tool: Switch to {rec.alternativeTool.name} ({rec.alternativeTool.plan})
                  </strong>
                  <div style={{ color: "var(--text-secondary)", marginTop: "3px" }}>
                    {rec.alternativeTool.reason}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal: Email Report */}
      <AnimatePresence>
        {showLeadModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
            onClick={() => setShowLeadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-elevated"
              style={{
                maxWidth: "440px",
                width: "100%",
                borderRadius: "var(--radius-xl)",
                padding: "clamp(20px, 4vw, 28px)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "8px" }}>📄</div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, textAlign: "center", color: "var(--text-primary)" }}>
                Get Executive PDF Audit Report
              </h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "4px", marginBottom: "16px" }}>
                Receive a complete financial memo formatted for founders, CTOs, and finance teams in {currency}.
              </p>

              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="founder@company.com"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  marginBottom: "14px",
                }}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSendingLead}
                  onClick={handleLeadSubmit}
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--accent-primary)",
                    border: "none",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: isSendingLead ? "wait" : "pointer",
                  }}
                >
                  {isSendingLead ? "Sending Memo..." : "Send Audit Memo →"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
