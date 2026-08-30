"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { useAuditStore } from "@/store/auditStore";

interface ToolMatrixItem {
  id: string;
  name: string;
  badge: string;
  logo: string;
  priceINR: number;
  priceUSD: number;
  speed: string;
  contextWindow: string;
  bestFor: string;
  features: string[];
}

const MATRIX_TOOLS: ToolMatrixItem[] = [
  {
    id: "cursor",
    name: "Cursor Pro",
    badge: "Most Popular Editor",
    logo: "🖱️",
    priceINR: 1700,
    priceUSD: 20,
    speed: "⚡⚡⚡⚡⚡ Ultra Fast",
    contextWindow: "Unlimited indexing",
    bestFor: "Full-repo refactoring & agentic AI loops",
    features: [
      "Multi-file codebase edits",
      "Claude 3.5 Sonnet & GPT-4o integration",
      "Inline terminal AI execution",
      "Rules for AI (.cursorrules)",
    ],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    badge: "Enterprise Standard",
    logo: "🐙",
    priceINR: 850,
    priceUSD: 10,
    speed: "⚡⚡⚡⚡ High",
    contextWindow: "Open files + Workspace",
    bestFor: "Teams in VS Code & JetBrains on GitHub Enterprise",
    features: [
      "Zero-latency autocompletions",
      "GitHub PR description generation",
      "Organization security controls",
      "Custom internal model fine-tuning",
    ],
  },
  {
    id: "windsurf",
    name: "Windsurf Pro",
    badge: "Best Value Pick",
    logo: "🌊",
    priceINR: 1275,
    priceUSD: 15,
    speed: "⚡⚡⚡⚡⚡ Real-time Flow",
    contextWindow: "Dynamic deep index",
    bestFor: "Autonomous Cascade agents at lower monthly spend",
    features: [
      "Cascade agentic workflows",
      "₹425/seat cheaper than Cursor",
      "Instant terminal context syncing",
      "Supercomplete AI suggestion engine",
    ],
  },
  {
    id: "claude",
    name: "Claude Pro (Anthropic)",
    badge: "Deep Reasoning",
    logo: "🧠",
    priceINR: 1700,
    priceUSD: 20,
    speed: "⚡⚡⚡⚡ Very Fast",
    contextWindow: "200,000 tokens",
    bestFor: "Architecture design, code review & deep logic",
    features: [
      "Interactive Artifacts UI preview",
      "Project knowledge base repositories",
      "Industry-leading code reasoning benchmark",
      "Vision model for UI mockup translations",
    ],
  },
];

export default function ToolComparisonMatrix() {
  const [isOpen, setIsOpen] = useState(false);
  const currency = useAuditStore((s) => s.currency);

  return (
    <div style={{ marginTop: "48px", width: "100%" }}>
      {/* Toggle Bar */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        className="glass"
        style={{
          width: "100%",
          padding: "18px 24px",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          border: "1px solid var(--border-subtle)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>⚖️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
              2026 AI Developer Tool Benchmark & Pricing Matrix
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "2px" }}>
              Compare Cursor vs Copilot vs Windsurf vs Claude side-by-side
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: "var(--accent-subtle)",
            color: "var(--accent-primary)",
            fontWeight: 700,
            fontSize: "var(--text-xs)",
          }}
        >
          {isOpen ? "Hide Matrix ▲" : "View Comparison Matrix ▼"}
        </div>
      </button>

      {/* Expandable Grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden", marginTop: "16px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {MATRIX_TOOLS.map((tool) => (
                <motion.div
                  key={tool.id}
                  whileHover={{ y: -4 }}
                  className="glass"
                  style={{
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                  }}
                >
                  {/* Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{tool.logo}</span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--accent-subtle)",
                        color: "var(--accent-primary)",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-primary)" }}>
                      {tool.name}
                    </h3>
                    <div style={{ marginTop: "6px", display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "var(--text-2xl)",
                          fontWeight: 900,
                          color: "var(--text-primary)",
                        }}
                      >
                        {formatCurrency(tool.priceINR, currency)}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                        / dev / month
                      </span>
                    </div>

                    <div style={{ marginTop: "16px", fontSize: "var(--text-xs)", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Execution Speed: </span>
                        <strong style={{ color: "var(--text-primary)" }}>{tool.speed}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Context Window: </span>
                        <strong style={{ color: "var(--text-primary)" }}>{tool.contextWindow}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Best Fit: </span>
                        <strong style={{ color: "var(--text-primary)" }}>{tool.bestFor}</strong>
                      </div>
                    </div>

                    {/* Features list */}
                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                        Key Capabilities
                      </div>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                        {tool.features.map((feat) => (
                          <li key={feat} style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--status-success)" }}>✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
