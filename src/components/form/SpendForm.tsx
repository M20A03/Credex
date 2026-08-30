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
  const [selectedToolToAdd, setSelectedToolToAdd] = useState<string>("");
  const [analysisStep, setAnalysisStep] = useState<string>("");

  // Calculate live total monthly spend preview
  const liveTotalMonthlySpend = tools.reduce((acc, item) => {
    const tool = getToolById(item.toolId);
    const plan = tool?.plans.find((p) => p.id === item.planId);
    return acc + (plan ? plan.pricePerSeat * item.seats : 0);
  }, 0);

  const handleAddTool = (toolId: string) => {
    if (!toolId) return;
    if (tools.some((t) => t.toolId === toolId)) {
      addToast({ type: "info", message: "This tool is already added to your stack." });
      return;
    }
    const tool = getToolById(toolId);
    if (!tool) return;
    const defaultPlan = tool.plans.find((p) => p.popular) || tool.plans[0];
    setTools([...tools, { toolId, planId: defaultPlan.id, seats: Math.min(teamSize, 5) }]);
    setSelectedToolToAdd("");
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
      addToast({ type: "error", message: "Please add at least one AI tool to audit." });
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    // Dynamic analysis steps simulation for high-tech feeling
    setAnalysisStep("Auditing tier allocations & seat over-provisioning...");
    await new Promise((r) => setTimeout(r, 450));
    setAnalysisStep("Benchmarking pricing against 2026 SaaS rates in " + currency + "...");
    await new Promise((r) => setTimeout(r, 450));
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

  const availableToolsToAdd = TOOLS.filter((tool) => !tools.some((t) => t.toolId === tool.id));

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
      {/* 1-Click Preset Stack Chips */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 800,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>⚡</span> Quick Audit Presets (1-Click)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {PRESET_STACKS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              type="button"
              className="glass"
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({preset.teamSize} devs)</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Team Configuration Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "24px 28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: "var(--luxury-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "18px",
              }}
            >
              👥
            </div>
            <div>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--text-primary)" }}>
                Step 1: Your Team Profile
              </h2>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                Helps us calibrate license redundancy and seat sharing
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Team Size */}
            <div>
              <label
                htmlFor="team-size-input"
                style={{
                  display: "block",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                TEAM / COMPANY SIZE
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input
                  id="team-size-input"
                  type="number"
                  min={1}
                  max={10000}
                  value={teamSize}
                  onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: "100px",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "var(--text-base)",
                    fontWeight: 700,
                  }}
                />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  {teamSize === 1 ? "person (solo founder)" : "people in engineering / product"}
                </span>
              </div>
            </div>

            {/* Primary Use Case */}
            <div>
              <label
                htmlFor="use-case-select"
                style={{
                  display: "block",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                PRIMARY WORKLOAD
              </label>
              <select
                id="use-case-select"
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as "coding" | "writing" | "research" | "mixed")}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "var(--text-sm)",
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

        {/* AI Tools Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "24px 28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--luxury-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontSize: "18px",
                }}
              >
                🧰
              </div>
              <div>
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--text-primary)" }}>
                  Step 2: Active AI Tool Subscriptions ({tools.length})
                </h2>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  Add the tools your developers, product managers, or designers use
                </p>
              </div>
            </div>

            {/* Live Spend Ticker Pill */}
            <div
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent-subtle)",
                border: "1px solid var(--border-strong)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>CURRENT TOTAL:</span>
              <strong style={{ fontSize: "var(--text-sm)", color: "var(--accent-primary)", fontWeight: 900 }}>
                {formatCurrency(liveTotalMonthlySpend, currency)}/mo
              </strong>
            </div>
          </div>

          {/* Tools List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <AnimatePresence>
              {tools.map((item) => {
                const tool = getToolById(item.toolId);
                if (!tool) return null;
                const activePlan = tool.plans.find((p) => p.id === item.planId);
                const toolCost = activePlan ? activePlan.pricePerSeat * item.seats : 0;

                return (
                  <motion.div
                    key={item.toolId}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="glass"
                    style={{
                      borderRadius: "var(--radius-lg)",
                      padding: "16px 20px",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {/* Tool Header & Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "180px" }}>
                      <span style={{ fontSize: "28px" }}>{tool.logo}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                          {tool.name}
                        </div>
                        {tool.badge && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "var(--accent-primary)",
                            }}
                          >
                            {tool.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Plan Selector */}
                    <div style={{ flex: 1, minWidth: "160px" }}>
                      <label
                        htmlFor={`plan-select-${item.toolId}`}
                        style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}
                      >
                        TIER / PLAN
                      </label>
                      <select
                        id={`plan-select-${item.toolId}`}
                        value={item.planId}
                        onChange={(e) => handlePlanChange(item.toolId, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-strong)",
                          background: "var(--bg-input)",
                          color: "var(--text-primary)",
                          fontSize: "var(--text-xs)",
                          fontWeight: 600,
                        }}
                      >
                        {tool.plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.pricePerSeat, currency)}/seat)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Seats Stepper */}
                    <div style={{ width: "130px" }}>
                      <label
                        htmlFor={`seats-input-${item.toolId}`}
                        style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}
                      >
                        SEATS
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleSeatsChange(item.toolId, item.seats - 1)}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-strong)",
                            background: "var(--bg-card)",
                            color: "var(--text-primary)",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          -
                        </button>
                        <input
                          id={`seats-input-${item.toolId}`}
                          type="number"
                          min={1}
                          max={5000}
                          value={item.seats}
                          onChange={(e) => handleSeatsChange(item.toolId, parseInt(e.target.value) || 1)}
                          style={{
                            width: "50px",
                            textAlign: "center",
                            padding: "4px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-strong)",
                            background: "var(--bg-input)",
                            color: "var(--text-primary)",
                            fontWeight: 700,
                            fontSize: "var(--text-xs)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSeatsChange(item.toolId, item.seats + 1)}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-strong)",
                            background: "var(--bg-card)",
                            color: "var(--text-primary)",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Subtotal & Delete */}
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "110px", justifyContent: "flex-end" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                          {formatCurrency(toolCost, currency)}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>/month</div>
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
                          padding: "4px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Add Another Tool Dropdown / Quick Add Buttons */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {availableToolsToAdd.length > 0 ? (
              <div style={{ display: "flex", gap: "8px", flex: 1, minWidth: "240px" }}>
                <select
                  value={selectedToolToAdd}
                  onChange={(e) => setSelectedToolToAdd(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                  }}
                >
                  <option value="">+ Select another AI tool to add...</option>
                  {availableToolsToAdd.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logo} {t.name} ({t.category})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedToolToAdd}
                  onClick={() => handleAddTool(selectedToolToAdd)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "var(--radius-md)",
                    background: selectedToolToAdd ? "var(--accent-primary)" : "var(--accent-subtle)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "var(--text-xs)",
                    border: "none",
                    cursor: selectedToolToAdd ? "pointer" : "not-allowed",
                  }}
                >
                  Add Tool
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                ✨ All standard AI developer & productivity tools added.
              </div>
            )}
          </div>
        </motion.div>

        {/* Optional Contact Capture (For PDF & Executive Report) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "20px 28px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label
                htmlFor="work-email-input"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                WORK EMAIL (OPTIONAL FOR PDF EXPORT)
              </label>
              <input
                id="work-email-input"
                type="email"
                placeholder="founder@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "var(--text-xs)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="company-name-input"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                COMPANY NAME (OPTIONAL)
              </label>
              <input
                id="company-name-input"
                type="text"
                placeholder="Acme Tech Labs"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "var(--text-xs)",
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Submit Button & Live Loading State */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginTop: "8px" }}
        >
          <button
            type="submit"
            disabled={isSubmitting || isLoading || tools.length === 0}
            className="rotating-border"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "18px 32px",
              borderRadius: "var(--radius-full)",
              background: "var(--luxury-gradient)",
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: "var(--text-base)",
              letterSpacing: "0.02em",
              border: "none",
              cursor: isSubmitting || isLoading ? "wait" : "pointer",
              boxShadow: "var(--shadow-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
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

          <p style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔒</span> 100% Free · No credit card required · Instant calculations in {currency}
          </p>
        </motion.div>
      </form>
    </div>
  );
}
