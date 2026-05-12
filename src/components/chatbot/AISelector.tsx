import React from "react";
import { useAuditStore } from "@/store/auditStore";

// Define available AI models and emojis
const MODELS = [
  { id: "claude-sonnet-4-20250514", label: "Claude", emoji: "🤖" },
  { id: "gemini-pro", label: "Gemini", emoji: "🪐" },
  { id: "gpt-4o-mini", label: "ChatGPT", emoji: "💬" },
];

export default function AISelector() {
  const selectedAI = useAuditStore((s) => s.selectedAI);
  const setSelectedAI = useAuditStore((s) => s.setSelectedAI);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAI(e.target.value);
  };

  return (
    <div className="ai-selector glass rotating-border" style={{ marginRight: "12px", padding: "4px 8px", borderRadius: "var(--radius-md)" }}>
      <label htmlFor="ai-select" className="sr-only">Select AI model</label>
      <select
        id="ai-select"
        value={selectedAI}
        onChange={handleChange}
        className="bg-transparent text-primary outline-none"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
        }}
      >
        {MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.emoji} {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}
