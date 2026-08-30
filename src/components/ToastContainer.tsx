"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/lib/toast-store";

const ICONS = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "clamp(16px, 4vw, 24px)",
        right: "clamp(12px, 3vw, 24px)",
        left: "clamp(12px, 3vw, auto)",
        zIndex: 99999,
        pointerEvents: "none",
        maxWidth: 420,
        width: "min(420px, calc(100vw - 24px))",
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const icon = ICONS[toast.type];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="glass-elevated"
              style={{
                borderRadius: "var(--radius-md)",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
                pointerEvents: "auto",
                cursor: "pointer",
                borderLeft: `4px solid var(--status-${toast.type})`,
              }}
              onClick={() => removeToast(toast.id)}
              role="alert"
            >
              <span style={{ fontSize: 18, minWidth: 24 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-primary)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {toast.message}
                </p>
              </div>
              {toast.action && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-primary)",
                    fontWeight: 700,
                    fontSize: "var(--text-xs)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
