"use client";

import { useAuditStore } from "@/store/auditStore";
import { motion } from "framer-motion";

export default function CurrencyToggle() {
  const { currency, setCurrency } = useAuditStore();

  return (
    <div
      className="glass"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
      }}
    >
      <button
        onClick={() => setCurrency("INR")}
        type="button"
        style={{
          position: "relative",
          padding: "5px clamp(8px, 2vw, 12px)",
          borderRadius: "var(--radius-full)",
          fontSize: "11px",
          fontWeight: 800,
          border: "none",
          cursor: "pointer",
          background: "transparent",
          color: currency === "INR" ? "#FFFFFF" : "var(--text-muted)",
          transition: "color 0.2s ease",
          zIndex: 1,
        }}
      >
        {currency === "INR" && (
          <motion.div
            layoutId="currency-pill"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "var(--radius-full)",
              background: "var(--accent-primary)",
              zIndex: -1,
            }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
          />
        )}
        ₹ INR
      </button>

      <button
        onClick={() => setCurrency("USD")}
        type="button"
        style={{
          position: "relative",
          padding: "5px clamp(8px, 2vw, 12px)",
          borderRadius: "var(--radius-full)",
          fontSize: "11px",
          fontWeight: 800,
          border: "none",
          cursor: "pointer",
          background: "transparent",
          color: currency === "USD" ? "#FFFFFF" : "var(--text-muted)",
          transition: "color 0.2s ease",
          zIndex: 1,
        }}
      >
        {currency === "USD" && (
          <motion.div
            layoutId="currency-pill"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "var(--radius-full)",
              background: "var(--accent-primary)",
              zIndex: -1,
            }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
          />
        )}
        $ USD
      </button>
    </div>
  );
}
