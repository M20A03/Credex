"use client";

import { useTheme } from "./ThemeProvider";
import { useMounted } from "@/lib/use-mounted";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="glass theme-toggle-btn"
      style={{
        position: "relative",
        width: "clamp(34px, 8vw, 38px)",
        height: "clamp(34px, 8vw, 38px)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        transition: "background 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
        flexShrink: 0,
      }}
    >
      <motion.span
        key={isDark ? "dark" : "light"}
        initial={{ rotate: -90, scale: 0, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {isDark ? "🌙" : "☀️"}
      </motion.span>
    </button>
  );
}
