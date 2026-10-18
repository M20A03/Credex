"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TOOLS, getToolById } from "@/lib/pricing-data";
import { useAuditStore } from "@/store/auditStore";
import { apiFetch } from "@/lib/fetcher";
import { useToastStore } from "@/lib/toast-store";
import { formatCurrency } from "@/lib/currency";
import type { AuditResult } from "@/lib/audit-engine";

interface ToolItem {
  toolId: string;
  planId: string;
  seats: number;
}

const PRESET_STACKS: Array<{
  name: string;
  icon: string;
  teamSize: number;
  useCase: "coding" | "writing" | "research" | "mixed";
  tools: ToolItem[];
}> = [
  {
    name: "Solo Builder",
    icon: "⚡",
    teamSize: 1,
    useCase: "coding",
    tools: [
      { toolId: "cursor", planId: "pro", seats: 1 },
      { toolId: "claude", planId: "pro", seats: 1 },
    ],
  },
  {
    name: "5-Dev Startup",
    icon: "🚀",
    teamSize: 5,
    useCase: "coding",
    tools: [
      { toolId: "cursor", planId: "business", seats: 5 },
      { toolId: "github-copilot", planId: "business", seats: 5 },
      { toolId: "chatgpt", planId: "team", seats: 3 },
    ],
  },
  {
    name: "15-Seat Agency",
    icon: "🏢",
    teamSize: 15,
    useCase: "mixed",
    tools: [
      { toolId: "cursor", planId: "business", seats: 12 },
      { toolId: "claude", planId: "team", seats: 15 },
      { toolId: "perplexity", planId: "enterprise", seats: 8 },
    ],
  },
  {
    name: "50+ Enterprise",
    icon: "👑",
    teamSize: 50,
    useCase: "coding",
    tools: [
      { toolId: "cursor", planId: "enterprise", seats: 40 },
      { toolId: "github-copilot", planId: "enterprise", seats: 50 },
      { toolId: "claude", planId: "team", seats: 35 },
    ],
  },
];

export default function SpendForm() {
  const {
    teamSize,
    useCase,
    tools,
    currency,
    setTeamSize,
    setUseCase,
    setTools,
    setStep,
    setResult,
    setIsLoading,
    setIsSubmitting,
    isSubmitting,
    isLoading,
  } = useAuditStore();

  const addToast = useToastStore((s) => s.addToast);
  const [, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [analysisStep, setAnalysisStep] = useState<string>("");

  // Audit Dropzone & Document OCR states
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [fileStatusText, setFileStatusText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const simulateInvoiceAudit = async (
    fileName: string,
    sampleConfig: {
      teamSize: number;
      useCase: "coding" | "writing" | "research" | "mixed";
      tools: ToolItem[];
      companyName: string;
    }
  ) => {
    setIsProcessingFile(true);
    setUploadedFileName(fileName);
    setFileProgress(15);
    setFileStatusText("Scanning Balance Sheet & Tool Invoices...");

    await new Promise((r) => setTimeout(r, 450));
    setFileProgress(45);
    setFileStatusText("Calculating Liquidity Ratios & AI Seat Utilization...");

    await new Promise((r) => setTimeout(r, 450));
    setFileProgress(80);
    setFileStatusText("Checking Compliance & Redundant Seat Multipliers...");

    await new Promise((r) => setTimeout(r, 450));
    setFileProgress(100);
    setFileStatusText(`Ingested ${sampleConfig.tools.length} developer tools!`);

    setTeamSize(sampleConfig.teamSize);
    setUseCase(sampleConfig.useCase);
    setTools(sampleConfig.tools);
    if (!company) setCompany(sampleConfig.companyName);

    await new Promise((r) => setTimeout(r, 350));
    setIsProcessingFile(false);
    addToast({
      type: "success",
      message: `📄 Ingested ${fileName}: ${sampleConfig.tools.length} AI tools populated!`,
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      simulateInvoiceAudit(file.name, {
        teamSize: 15,
        useCase: "mixed",
        companyName: "Acme Tech",
        tools: [
          { toolId: "cursor", planId: "business", seats: 12 },
          { toolId: "claude", planId: "team", seats: 15 },
          { toolId: "github-copilot", planId: "business", seats: 10 },
          { toolId: "chatgpt", planId: "team", seats: 6 },
        ],
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      simulateInvoiceAudit(file.name, {
        teamSize: 15,
        useCase: "coding",
        companyName: "DevCorp",
        tools: [
          { toolId: "cursor", planId: "business", seats: 14 },
          { toolId: "claude", planId: "team", seats: 10 },
          { toolId: "perplexity", planId: "pro", seats: 5 },
        ],
      });
    }
  };

  // Calculate live total monthly spend preview
  const liveTotalMonthlySpend = tools.reduce((acc, item) => {
    const tool = getToolById(item.toolId);
    const plan = tool?.plans.find((p) => p.id === item.planId);
    return acc + (plan ? plan.pricePerSeat * item.seats : 0);
  }, 0);

  const toggleTool = (toolId: string) => {
    if (tools.some((t) => t.toolId === toolId)) {
      setTools(tools.filter((t) => t.toolId !== toolId));
    } else {
      const tool = getToolById(toolId);
      if (!tool) return;
      const defaultPlan = tool.plans.find((p) => p.popular) || tool.plans[0];
      setTools([...tools, { toolId, planId: defaultPlan.id, seats: Math.min(teamSize, 5) }]);
      addToast({ type: "success", message: `Added ${tool.name} to stack!` });
    }
  };

  const handleRemoveTool = (toolId: string) => {
    setTools(tools.filter((t) => t.toolId !== toolId));
  };

  const handlePlanChange = (toolId: string, planId: string) => {
    setTools(tools.map((t) => (t.toolId === toolId ? { ...t, planId } : t)));
  };

  const handleSeatsChange = (toolId: string, seats: number) => {
    const validSeats = Math.max(1, Math.min(seats, 5000));
    setTools(tools.map((t) => (t.toolId === toolId ? { ...t, seats: validSeats } : t)));
  };

  const applyPreset = (preset: (typeof PRESET_STACKS)[0]) => {
    setTeamSize(preset.teamSize);
    setUseCase(preset.useCase);
    setTools(preset.tools);
    addToast({ type: "info", message: `Applied ${preset.name} stack!` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tools.length === 0) {
      addToast({ type: "error", message: "Please select at least one AI tool to audit." });
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    // Dynamic analysis steps simulation for high-tech feeling
    setAnalysisStep("Auditing tier allocations & seat over-provisioning...");
    await new Promise((r) => setTimeout(r, 400));
    setAnalysisStep("Benchmarking pricing against 2026 SaaS rates in " + currency + "...");
    await new Promise((r) => setTimeout(r, 400));
    setAnalysisStep("Synthesizing ROI & alternative migration roadmap...");

    try {
      const idempotencyKey = `audit_${tools.map((t) => `${t.toolId}-${t.planId}-${t.seats}`).join("_")}_${teamSize}_${currency}`;

      const data = await apiFetch<AuditResult>("/api/audit", {
        method: "POST",
        body: JSON.stringify({
          tools,
          teamSize,
          useCase,
          currency,
          email: email || undefined,
          company: company || undefined,
        }),
        idempotencyKey,
        timeoutMs: 15000,
        retries: 2,
      });

      startTransition(() => {
        setResult(data);
      });

      if (email) {
        apiFetch("/api/lead", {
          method: "POST",
          body: JSON.stringify({ email, company, teamSize, source: "spend_form" }),
          showToastOnError: false,
          timeoutMs: 8000,
        }).catch(() => {});
      }

      addToast({
        type: "success",
        message: "✨ Audit complete! Viewing detailed savings analysis.",
      });

      setStep("results");
    } catch (error: unknown) {
      console.error("Audit submission failed:", error);
      setStep("form");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
      setAnalysisStep("");
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", width: "100%" }}>
      {/* 3-Step Visual Quick Guide */}
      <div
        className="glass"
        style={{
          borderRadius: "var(--radius-lg)",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "10px",
          fontSize: "var(--text-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ background: "var(--accent-primary)", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>1</span>
          <span style={{ fontWeight: 700 }}>Pick your tools</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ background: "var(--accent-primary)", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>2</span>
          <span style={{ fontWeight: 700 }}>Set team size</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ background: "var(--status-success)", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>3</span>
          <span style={{ fontWeight: 700 }}>Instant ₹/$ savings</span>
        </div>
      </div>

      {/* Interactive Audit Dropzone & OCR Ingestion */}
      <div style={{ marginBottom: "20px" }}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className="glass-elevated"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "clamp(16px, 3vw, 24px)",
            border: isDragging ? "2px dashed var(--accent-primary)" : "1px dashed var(--border-strong)",
            background: isDragging ? "var(--accent-subtle)" : "var(--bg-card)",
            boxShadow: isDragging ? "0 0 25px var(--accent-glow)" : undefined,
            transition: "all 0.25s ease",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <input
            id="audit-file-input"
            type="file"
            accept=".csv,.pdf,.xlsx,.json"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />

          {isProcessingFile ? (
            <div style={{ padding: "8px 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                style={{ fontSize: "2rem", display: "inline-block", marginBottom: "8px" }}
              >
                ⚡
              </motion.div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px" }}>
                {fileStatusText}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Target File: <strong style={{ color: "var(--accent-cyan)" }}>{uploadedFileName}</strong>
              </div>
              {/* Animated Progress Bar */}
              <div
                style={{
                  height: "8px",
                  maxWidth: "360px",
                  margin: "0 auto",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.1)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  style={{
                    height: "100%",
                    borderRadius: "9999px",
                    background: "var(--luxury-gradient)",
                  }}
                  animate={{ width: `${fileProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "2rem", marginBottom: "6px" }}>📁</div>
              <h3 style={{ fontSize: "clamp(14px, 3vw, 17px)", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
                Auto-Audit: Drop Balance Sheet or Invoice
              </h3>
              <p style={{ fontSize: "clamp(11px, 2.4vw, 13px)", color: "var(--text-secondary)", maxWidth: "540px", margin: "0 auto 12px" }}>
                Drag & drop SaaS ledger, credit card billing PDF, or tool export. Our engine extracts seats and calculates redundancy.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", alignItems: "center" }}>
                <label
                  htmlFor="audit-file-input"
                  className="rotating-border"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 18px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--luxury-gradient)",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  <span>📤</span>
                  <span>Browse Document (.csv, .pdf, .json)</span>
                </label>

                {uploadedFileName && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--status-success)",
                      background: "var(--status-success-bg)",
                      border: "1px solid var(--status-success-border)",
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      fontWeight: 700,
                    }}
                  >
                    ✓ Ingested: {uploadedFileName}
                  </span>
                )}
              </div>

              {/* Quick Sample Files */}
              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginRight: "8px" }}>
                  Or simulate with sample ledger:
                </span>
                <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      simulateInvoiceAudit("Acme-AI-Spend-Q3.csv", {
                        teamSize: 15,
                        useCase: "coding",
                        companyName: "Acme Cloud",
                        tools: [
                          { toolId: "cursor", planId: "business", seats: 12 },
                          { toolId: "claude", planId: "team", seats: 15 },
                          { toolId: "github-copilot", planId: "business", seats: 10 },
                        ],
                      })
                    }
                    className="glass"
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    📄 Acme-AI-Spend-Q3.csv
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      simulateInvoiceAudit("YC-Batch-Invoices.pdf", {
                        teamSize: 5,
                        useCase: "coding",
                        companyName: "YC Startup",
                        tools: [
                          { toolId: "cursor", planId: "business", seats: 5 },
                          { toolId: "chatgpt", planId: "team", seats: 4 },
                          { toolId: "perplexity", planId: "pro", seats: 3 },
                        ],
                      })
                    }
                    className="glass"
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    📊 YC-Batch-Invoices.pdf
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      simulateInvoiceAudit("Enterprise-Ledger-2026.json", {
                        teamSize: 50,
                        useCase: "mixed",
                        companyName: "Fintech Core Ltd",
                        tools: [
                          { toolId: "cursor", planId: "enterprise", seats: 45 },
                          { toolId: "github-copilot", planId: "enterprise", seats: 50 },
                          { toolId: "claude", planId: "team", seats: 40 },
                          { toolId: "chatgpt", planId: "enterprise", seats: 30 },
                        ],
                      })
                    }
                    className="glass"
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    ⚡ Enterprise-Ledger-2026.json
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1-Click Preset Stack Chips */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>⚡</span> Quick 1-Click Starter Stacks
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {PRESET_STACKS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              type="button"
              className="glass"
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>({preset.teamSize} devs)</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Visual 1-Click Tool Selector Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "clamp(16px, 3.5vw, 24px) clamp(12px, 3vw, 28px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "clamp(15px, 3vw, 18px)", fontWeight: 800, color: "var(--text-primary)" }}>
                Step 1: Click Tools In Your Stack ({tools.length} active)
              </h2>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Tap any tool icon to add or remove it from your audit
              </p>
            </div>

            {/* Live Spend Pill */}
            <div
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent-subtle)",
                border: "1px solid var(--border-strong)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL:</span>
              <strong style={{ fontSize: "13px", color: "var(--accent-primary)", fontWeight: 900 }}>
                {formatCurrency(liveTotalMonthlySpend, currency)}/mo
              </strong>
            </div>
          </div>

          {/* Interactive Tool Grid Tiles (Mobile 3-column / Desktop adaptive) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(clamp(85px, 20vw, 120px), 1fr))",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {TOOLS.map((t) => {
              const isSelected = tools.some((tool) => tool.toolId === t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTool(t.id)}
                  style={{
                    padding: "10px 6px",
                    borderRadius: "var(--radius-md)",
                    border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                    background: isSelected ? "var(--accent-subtle)" : "var(--bg-input)",
                    color: "var(--text-primary)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 0 12px var(--accent-glow)" : "none",
                  }}
                >
                  <span style={{ fontSize: "clamp(20px, 4.5vw, 24px)" }}>{t.logo}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{t.name}</span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      color: isSelected ? "var(--status-success)" : "var(--text-muted)",
                    }}
                  >
                    {isSelected ? "✓ Added" : "+ Add"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Configured Tools Seat & Plan Customizer */}
          {tools.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>
                Adjust Active Tiers & Seat Counts:
              </div>
              <AnimatePresence>
                {tools.map((item) => {
                  const tool = getToolById(item.toolId);
                  if (!tool) return null;
                  const activePlan = tool.plans.find((p) => p.id === item.planId);
                  const toolCost = activePlan ? activePlan.pricePerSeat * item.seats : 0;

                  return (
                    <motion.div
                      key={item.toolId}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass"
                      style={{
                        borderRadius: "var(--radius-md)",
                        padding: "12px clamp(10px, 2.5vw, 16px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {/* Top row: Tool Info + Remove Button */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "20px" }}>{tool.logo}</span>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-primary)" }}>
                              {tool.name}
                            </span>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "6px" }}>
                              ({formatCurrency(activePlan?.pricePerSeat || 0, currency)}/seat)
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTool(item.toolId)}
                          aria-label={`Remove ${tool.name}`}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--status-danger)",
                            cursor: "pointer",
                            fontSize: "16px",
                            padding: "6px 8px",
                            borderRadius: "var(--radius-xs)",
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Bottom row: Plan Dropdown + Seats Stepper + Subtotal */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {/* Plan Dropdown */}
                        <div>
                          <select
                            value={item.planId}
                            onChange={(e) => handlePlanChange(item.toolId, e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-strong)",
                              background: "var(--bg-input)",
                              color: "var(--text-primary)",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {tool.plans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({formatCurrency(p.pricePerSeat, currency)}/mo)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Seats Stepper & Subtotal Row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          {/* Stepper */}
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <button
                              type="button"
                              onClick={() => handleSeatsChange(item.toolId, item.seats - 1)}
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-strong)",
                                background: "var(--bg-card)",
                                color: "var(--text-primary)",
                                fontWeight: 800,
                                fontSize: "14px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: "12px", fontWeight: 800, minWidth: "48px", textAlign: "center" }}>
                              {item.seats} {item.seats === 1 ? "seat" : "seats"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSeatsChange(item.toolId, item.seats + 1)}
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-strong)",
                                background: "var(--bg-card)",
                                color: "var(--text-primary)",
                                fontWeight: 800,
                                fontSize: "14px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-primary)" }}>
                              {formatCurrency(toolCost, currency)}
                            </div>
                            <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>/month</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Team Size & Workload Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "clamp(16px, 3.5vw, 24px) clamp(12px, 3vw, 28px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
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
                fontSize: "15px",
                flexShrink: 0,
              }}
            >
              👥
            </div>
            <div>
              <h2 style={{ fontSize: "clamp(15px, 3vw, 18px)", fontWeight: 800, color: "var(--text-primary)" }}>
                Step 2: Team Size & Workload Profile
              </h2>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Used to determine over-provisioned enterprise minimums
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: "16px",
            }}
          >
            {/* Team Size Slider & Number */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label
                  htmlFor="team-size-range"
                  style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}
                >
                  TEAM / COMPANY SIZE
                </label>
                <strong style={{ fontSize: "12px", color: "var(--accent-primary)" }}>
                  {teamSize} {teamSize === 1 ? "Person" : "People"}
                </strong>
              </div>
              <input
                id="team-size-range"
                type="range"
                min={1}
                max={100}
                value={Math.min(teamSize, 100)}
                onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Primary Workload */}
            <div>
              <label
                htmlFor="workload-select"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                PRIMARY WORKLOAD
              </label>
              <select
                id="workload-select"
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as "coding" | "writing" | "research" | "mixed")}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <option value="coding">💻 Coding & Software Engineering</option>
                <option value="research">🔍 Research & Data Intelligence</option>
                <option value="writing">✍️ Content & Copywriting</option>
                <option value="mixed">🌐 Mixed Cross-Functional Operations</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Optional Email & Company */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "clamp(14px, 3vw, 20px) clamp(12px, 3vw, 28px)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label
                htmlFor="work-email-input"
                style={{
                  display: "block",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                WORK EMAIL (OPTIONAL)
              </label>
              <input
                id="work-email-input"
                type="email"
                placeholder="founder@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="company-name-input"
                style={{
                  display: "block",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                COMPANY / TEAM NAME (OPTIONAL)
              </label>
              <input
                id="company-name-input"
                type="text"
                placeholder="Acme Labs"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Submit Action */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "4px" }}
        >
          <button
            type="submit"
            disabled={isSubmitting || isLoading || tools.length === 0}
            className="rotating-border"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "clamp(14px, 3.5vw, 18px) clamp(16px, 4vw, 32px)",
              borderRadius: "var(--radius-full)",
              background: "var(--luxury-gradient)",
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: "clamp(14px, 3.2vw, 16px)",
              letterSpacing: "0.02em",
              border: "none",
              cursor: isSubmitting || isLoading ? "wait" : "pointer",
              boxShadow: "var(--shadow-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isSubmitting || isLoading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ display: "inline-block" }}
                >
                  ⚡
                </motion.span>
                <span>{analysisStep || "Running AI Spend Audit..."}</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Run Free AI Spend & Savings Audit</span>
                <span>→</span>
              </>
            )}
          </button>

          <p style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px", textAlign: "center" }}>
            <span>🔒</span> 100% Free · No credit card required · Instant {currency} calculations
          </p>
        </motion.div>
      </form>
    </div>
  );
}
