"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditStore } from "@/store/auditStore";
import { useToastStore } from "@/lib/toast-store";
import { TOOLS } from "@/lib/pricing-data";
import { formatINR } from "@/lib/currency";

export default function SpendForm() {
  const {
    tools, teamSize, useCase, email, company,
    addTool, updateTool, removeTool,
    setTeamSize, setUseCase, setEmail, setCompany,
    setStep, setResult, setIsLoading, isLoading,
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
      errors.email = "Please enter a valid email address.";
    }

    if (email && email.length > 255) {
      errors.email = "Email is too long.";
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
        message: "All tools are already added to your audit.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      addToast({
        type: "error",
        message: "Please fix the errors below before submitting.",
      });
      return;
    }

    setStep("processing");
    setIsLoading(true);

    try {
      const formData = getFormData();
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Audit failed");
      }

      const result = await res.json();
      setResult(result);

      // Capture lead if email provided
      if (email) {
        try {
          await fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, company, source: "form" }),
            signal: AbortSignal.timeout(10000),
          });
        } catch (e) {
          console.warn("Lead capture failed:", e);
          // Don't fail the audit if lead capture fails
        }
      }

      addToast({
        type: "success",
        message: "✨ Your audit is ready! Check your results below.",
      });
      setStep("results");
    } catch (error) {
      console.error("Audit error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process audit";
      addToast({
        type: "error",
        message: errorMessage,
        duration: 5000,
      });
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", opacity: isLoading ? 0.5 : 1 }}>
      {/* Section: Team basics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ borderRadius: 20, padding: 32, marginBottom: 20, pointerEvents: isLoading ? "none" : "auto" }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "rgba(15,23,42,0.9)" }}>
          👥 Your Team
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label className="form-label">Team Size</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className={`form-input ${fieldErrors.teamSize ? "error" : ""}`}
              placeholder="e.g. 5"
              disabled={isLoading}
              aria-describedby={fieldErrors.teamSize ? "teamSize-error" : undefined}
            />
            {fieldErrors.teamSize && (
              <p id="teamSize-error" style={{ fontSize: 12, color: "#FCA5A5", marginTop: 4 }}>
                {fieldErrors.teamSize}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Primary Use Case</label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value as "coding" | "writing" | "research" | "mixed")}
              className="form-select"
              disabled={isLoading}
            >
              <option value="coding">💻 Coding / Engineering</option>
              <option value="writing">✍️ Writing / Marketing</option>
              <option value="research">🔬 Research / Data</option>
              <option value="mixed">🎯 Mixed / General</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Section: Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{ borderRadius: 20, padding: 32, marginBottom: 20, pointerEvents: isLoading ? "none" : "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "rgba(15,23,42,0.9)" }}>
            🛠️ Your AI Tools
          </h2>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleAddTool}
            disabled={tools.length >= TOOLS.length || isLoading}
            style={{
              background: "rgba(109,40,217,0.08)",
              border: "1px solid rgba(109,40,217,0.4)",
              borderRadius: 10,
              color: "rgba(15,23,42,0.85)",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: tools.length >= TOOLS.length || isLoading ? "not-allowed" : "pointer",
              opacity: tools.length >= TOOLS.length || isLoading ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            + Add Tool
          </motion.button>
        </div>

        {fieldErrors.tools && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#FCA5A5",
            fontSize: 14,
          }}>
            ⚠️ {fieldErrors.tools}
          </div>
        )}

        <AnimatePresence>
          {tools.length === 0 && !fieldErrors.tools && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "rgba(15,23,42,0.35)",
                border: "2px dashed rgba(15,23,42,0.08)",
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 15 }}>No tools added yet.</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Click "Add Tool" to get started.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AnimatePresence>
            {tools.map((toolInput, idx) => {
              const toolDef = TOOLS.find((t) => t.id === toolInput.toolId);
              const planDef = toolDef?.plans.find((p) => p.id === toolInput.planId);
              const monthlyCost = (planDef?.pricePerSeat || 0) * toolInput.seats;

              return (
                <motion.div
                  key={`${toolInput.toolId}-${idx}`}
                  initial={{ opacity: 0, x: -20, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="glass-elevated"
                  style={{ borderRadius: 14, padding: "20px 24px", position: "relative" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr 0.8fr auto", gap: 16, alignItems: "end" }}>
                    {/* Tool selector */}
                    <div>
                      <label className="form-label">Tool</label>
                      <select
                        value={toolInput.toolId}
                        onChange={(e) => {
                          const newTool = TOOLS.find((t) => t.id === e.target.value);
                          updateTool(idx, {
                            toolId: e.target.value,
                            planId: newTool?.plans[1]?.id || newTool?.plans[0].id || "",
                          });
                        }}
                        className="form-select"
                      >
                        {TOOLS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.logo} {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Plan selector */}
                    <div>
                      <label className="form-label">Plan</label>
                      <select
                        value={toolInput.planId}
                        onChange={(e) => updateTool(idx, { planId: e.target.value })}
                        className="form-select"
                      >
                        {toolDef?.plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.pricePerSeat > 0 ? formatINR(p.pricePerSeat) + "/seat" : "Free"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Seats */}
                    <div>
                      <label className="form-label">Seats</label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={toolInput.seats}
                        onChange={(e) => updateTool(idx, { seats: Math.max(1, Number(e.target.value)) })}
                        className="form-input"
                      />
                    </div>

                    {/* Remove */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeTool(idx)}
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 8,
                        color: "#FCA5A5",
                        fontSize: 18,
                        width: 40,
                        height: 48,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </motion.button>
                  </div>

                  {/* Cost preview */}
                  {monthlyCost > 0 && (
                    <div style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: "rgba(15,23,42,0.45)",
                      display: "flex",
                      gap: 16,
                    }}>
                      <span>Monthly: <strong style={{ color: "rgba(15,23,42,0.75)" }}>{formatINR(monthlyCost)}</strong></span>
                      <span>Annual: <strong style={{ color: "rgba(15,23,42,0.75)" }}>{formatINR(monthlyCost * 12)}</strong></span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Section: Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass"
        style={{ borderRadius: 20, padding: 32, marginBottom: 20, pointerEvents: isLoading ? "none" : "auto" }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: "rgba(15,23,42,0.9)" }}>
          📧 Get Results via Email <span style={{ fontSize: 14, fontWeight: 400, color: "rgba(15,23,42,0.4)" }}>(optional)</span>
        </h2>
        <p style={{ fontSize: 13, color: "rgba(15,23,42,0.4)", marginBottom: 20 }}>
          No spam. Unsubscribe in 1 click. We'll send your full audit summary.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="form-label">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@startup.com"
              className={`form-input ${fieldErrors.email ? "error" : ""}`}
              disabled={isLoading}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" style={{ fontSize: 12, color: "#FCA5A5", marginTop: 4 }}>
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Company (optional)</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              className={`form-input ${fieldErrors.company ? "error" : ""}`}
              disabled={isLoading}
              aria-describedby={fieldErrors.company ? "company-error" : undefined}
            />
            {fieldErrors.company && (
              <p id="company-error" style={{ fontSize: 12, color: "#FCA5A5", marginTop: 4 }}>
                {fieldErrors.company}
              </p>
            )}
          </div>
        </div>
        {/* Honeypot */}
        <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} aria-hidden />
      </motion.div>

      {/* Submit */}
      <motion.button
        whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -2 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        onClick={handleSubmit}
        disabled={isLoading}
        className="btn-primary rotating-border"
        style={{
          width: "100%",
          fontSize: 17,
          padding: "18px 32px",
          borderRadius: 14,
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? "wait" : "pointer",
        }}
      >
        {isLoading ? "⏳ Processing Your Audit..." : "✦ Run My Free AI Spend Audit →"}
      </motion.button>
    </div>
  );
}
