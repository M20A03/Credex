"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditStore } from "@/store/auditStore";
import { useToastStore } from "@/lib/toast-store";
import { TOOLS } from "@/lib/pricing-data";
import { formatINR } from "@/lib/currency";
import { apiFetch } from "@/lib/fetcher";
import type { AuditResult } from "@/lib/audit-engine";

export default function SpendForm() {
  const {
    tools,
    teamSize,
    useCase,
    email,
    company,
    addTool,
    updateTool,
    removeTool,
    setTeamSize,
    setUseCase,
    setEmail,
    setCompany,
    setStep,
    setResult,
    setIsLoading,
    isLoading,
    isSubmitting,
    setIsSubmitting,
    getFormData,
  } = useAuditStore();

  const { addToast } = useToastStore();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (tools.length === 0) {
      errors.tools = "Please add at least one AI tool to audit.";
    }

    if (!teamSize || teamSize < 1 || teamSize > 10000) {
      errors.teamSize = "Team size must be between 1 and 10,000.";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid work email address.";
    }

    if (email && email.length > 255) {
      errors.email = "Email address is too long.";
    }

    if (company && company.length > 255) {
      errors.company = "Company name is too long.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddTool = () => {
    const unusedTool = TOOLS.find((t) => !tools.some((u) => u.toolId === t.id));
    if (unusedTool) {
      addTool({
        toolId: unusedTool.id,
        planId: unusedTool.plans[1]?.id || unusedTool.plans[0].id,
        seats: 1,
        monthlySpend: 0,
      });
    } else {
      addToast({
        type: "info",
        message: "All supported tools have already been added to your stack.",
      });
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isLoading) return;

    if (!validateForm()) {
      addToast({
        type: "error",
        message: "Please correct the highlighted fields before proceeding.",
      });
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setStep("processing");

    // Generate deterministic idempotency key per submission
    const idempotencyKey = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      const formData = getFormData();
      const result = await apiFetch<AuditResult>("/api/audit", {
        method: "POST",
        body: JSON.stringify(formData),
        idempotencyKey,
        timeoutMs: 25000,
        retries: 1,
      });

      setResult(result);

      // Async lead capture
      if (email) {
        apiFetch("/api/lead", {
          method: "POST",
          body: JSON.stringify({ email, company, teamSize, source: "spend_form" }),
          showToastOnError: false,
          timeoutMs: 8000,
        }).catch((err) => console.warn("Background lead capture note:", err));
      }

      addToast({
        type: "success",
        message: "✨ Audit generated successfully! Viewing breakdown below.",
      });
      setStep("results");
    } catch (error: unknown) {
      console.error("Audit submission failed:", error);
      setStep("form");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", opacity: isLoading ? 0.6 : 1, transition: "opacity 0.2s ease" }}>
      {/* Section: Team Basics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-8)",
          marginBottom: "var(--space-6)",
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            marginBottom: "var(--space-6)",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span>👥</span> Team Profile
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-5)" }}>
          <div>
            <label
              htmlFor="team-size-input"
              style={{
                display: "block",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "var(--space-2)",
              }}
            >
              Team Size (Engineers / Knowledge Workers)
            </label>
            <input
              id="team-size-input"
              type="number"
              min={1}
              max={10000}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              placeholder="e.g. 10"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${fieldErrors.teamSize ? "var(--status-danger)" : "var(--border-strong)"}`,
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "var(--text-base)",
              }}
              aria-invalid={Boolean(fieldErrors.teamSize)}
            />
            {fieldErrors.teamSize && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--status-danger)", marginTop: "var(--space-1)" }}>
                {fieldErrors.teamSize}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="use-case-select"
              style={{
                display: "block",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "var(--space-2)",
              }}
            >
              Primary AI Workload
            </label>
            <select
              id="use-case-select"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value as "coding" | "writing" | "research" | "mixed")}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "var(--text-base)",
              }}
            >
              <option value="coding">💻 Software Engineering & Pair Programming</option>
              <option value="writing">✍️ Copywriting, Marketing & Documentation</option>
              <option value="research">🔬 Data Analysis, Research & Modeling</option>
              <option value="mixed">🎯 Cross-Functional Startup Stack</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Section: AI Tools Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-8)",
          marginBottom: "var(--space-6)",
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <h2
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <span>🛠️</span> Active AI Tool Subscriptions
          </h2>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleAddTool}
            disabled={tools.length >= TOOLS.length || isLoading}
            type="button"
            style={{
              background: "var(--accent-subtle)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              padding: "8px 16px",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              cursor: tools.length >= TOOLS.length || isLoading ? "not-allowed" : "pointer",
              opacity: tools.length >= TOOLS.length || isLoading ? 0.5 : 1,
            }}
          >
            + Add Tool
          </motion.button>
        </div>

        {fieldErrors.tools && (
          <div
            style={{
              background: "var(--status-danger-bg)",
              border: "1px solid var(--status-danger-border)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              marginBottom: "var(--space-4)",
              color: "var(--status-danger)",
              fontSize: "var(--text-sm)",
            }}
          >
            ⚠️ {fieldErrors.tools}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <AnimatePresence>
            {tools.map((toolInput, idx) => {
              const toolDef = TOOLS.find((t) => t.id === toolInput.toolId);
              const planDef = toolDef?.plans.find((p) => p.id === toolInput.planId);
              const monthlyCost = (planDef?.pricePerSeat || 0) * toolInput.seats;

              return (
                <motion.div
                  key={`${toolInput.toolId}-${idx}`}
                  initial={{ opacity: 0, x: -20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className="glass-elevated"
                  style={{ borderRadius: "var(--radius-lg)", padding: "18px 20px" }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr)) auto",
                      gap: "var(--space-3)",
                      alignItems: "end",
                    }}
                  >
                    {/* Tool Select */}
                    <div>
                      <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        Tool
                      </label>
                      <select
                        value={toolInput.toolId}
                        onChange={(e) => {
                          const newTool = TOOLS.find((t) => t.id === e.target.value);
                          updateTool(idx, {
                            toolId: e.target.value,
                            planId: newTool?.plans[1]?.id || newTool?.plans[0].id || "",
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--bg-input)",
                          color: "var(--text-primary)",
                          fontSize: "var(--text-sm)",
                        }}
                      >
                        {TOOLS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.logo} {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Plan Select */}
                    <div>
                      <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        Tier / Plan
                      </label>
                      <select
                        value={toolInput.planId}
                        onChange={(e) => updateTool(idx, { planId: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--bg-input)",
                          color: "var(--text-primary)",
                          fontSize: "var(--text-sm)",
                        }}
                      >
                        {toolDef?.plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.pricePerSeat > 0 ? `${formatINR(p.pricePerSeat)}/seat` : "Free"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Seats */}
                    <div style={{ maxWidth: 120 }}>
                      <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                        Active Seats
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={toolInput.seats}
                        onChange={(e) => updateTool(idx, { seats: Math.max(1, Number(e.target.value)) })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          background: "var(--bg-input)",
                          color: "var(--text-primary)",
                          fontSize: "var(--text-sm)",
                        }}
                      />
                    </div>

                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => removeTool(idx)}
                      type="button"
                      aria-label="Remove tool"
                      style={{
                        background: "var(--status-danger-bg)",
                        border: "1px solid var(--status-danger-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--status-danger)",
                        fontSize: 18,
                        width: 38,
                        height: 38,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </motion.button>
                  </div>

                  {monthlyCost > 0 && (
                    <div
                      style={{
                        marginTop: "var(--space-2)",
                        fontSize: "var(--text-xs)",
                        color: "var(--text-muted)",
                        display: "flex",
                        gap: "var(--space-4)",
                      }}
                    >
                      <span>
                        Monthly: <strong style={{ color: "var(--text-primary)" }}>{formatINR(monthlyCost)}</strong>
                      </span>
                      <span>
                        Annual: <strong style={{ color: "var(--text-primary)" }}>{formatINR(monthlyCost * 12)}</strong>
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Section: Email Report Delivery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-8)",
          marginBottom: "var(--space-6)",
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            marginBottom: "var(--space-1)",
            color: "var(--text-primary)",
          }}
        >
          📧 Email Executive Report <span style={{ fontSize: "var(--text-sm)", fontWeight: 400, color: "var(--text-muted)" }}>(Optional)</span>
        </h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>
          Receive an executive PDF summary and tool renegotiation cheat sheet.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@startup.in"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${fieldErrors.email ? "var(--status-danger)" : "var(--border-strong)"}`,
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "var(--text-base)",
              }}
            />
            {fieldErrors.email && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--status-danger)", marginTop: 4 }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
              Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Credex Tech"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "var(--text-base)",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Submit CTA */}
      <motion.button
        whileHover={{ scale: isLoading || isSubmitting ? 1 : 1.02, y: isLoading || isSubmitting ? 0 : -2 }}
        whileTap={{ scale: isLoading || isSubmitting ? 1 : 0.98 }}
        onClick={handleSubmit}
        disabled={isLoading || isSubmitting}
        type="button"
        className="rotating-border"
        style={{
          width: "100%",
          fontSize: "var(--text-lg)",
          fontWeight: 700,
          padding: "18px 32px",
          borderRadius: "var(--radius-lg)",
          background: "var(--luxury-gradient)",
          color: "#FFFFFF",
          border: "none",
          cursor: isLoading || isSubmitting ? "wait" : "pointer",
          boxShadow: "var(--shadow-elevated)",
          opacity: isLoading || isSubmitting ? 0.75 : 1,
        }}
      >
        {isLoading || isSubmitting ? "⏳ Calculating AI Optimization..." : "✦ Run Free AI Spend Audit →"}
      </motion.button>
    </div>
  );
}
