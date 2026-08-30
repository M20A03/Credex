"use client";

import React from "react";
import { useAuditStore } from "@/store/auditStore";

export const AI_MODELS = [
  { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet", emoji: "🧠", provider: "Anthropic" },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", emoji: "🤖", provider: "Anthropic" },
  { id: "gpt-4o", label: "GPT-4o (Omni)", emoji: "💬", provider: "OpenAI" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", emoji: "✨", provider: "Google" },
  { id: "deepseek-r1", label: "DeepSeek R1", emoji: "⚡", provider: "DeepSeek" },
];

export default function AISelector() {
  const selectedAI = useAuditStore((s) => s.selectedAI);
  const setSelectedAI = useAuditStore((s) => s.setSelectedAI);

  return (
    <div
      className="glass"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
      }}
    >
      <label htmlFor="ai-select" className="sr-only">
        Select AI reasoning model
      </label>
      <select
        id="ai-select"
        value={selectedAI}
        onChange={(e) => setSelectedAI(e.target.value)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-primary)",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
          outline: "none",
        }}
      >
        {AI_MODELS.map((model) => (
          <option key={model.id} value={model.id} style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
            {model.emoji} {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}
