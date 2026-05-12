"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/lib/toast-store";

const ICONS = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
};

const COLORS = {
  success: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)", text: "#10B981" },
  error: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", text: "#EF4444" },
  info: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)", text: "#3B82F6" },
  warning: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", text: "#F59E0B" },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        pointerEvents: "none",
        maxWidth: 400,
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const colors = COLORS[toast.type];
          const icon = ICONS[toast.type];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
                pointerEvents: "auto",
                cursor: "pointer",
                backdropFilter: "blur(10px)",
              }}
              onClick={() => removeToast(toast.id)}
              role="alert"
            >
              <span style={{ fontSize: 18, minWidth: 24 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    color: colors.text,
                    fontSize: 14,
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
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.text,
                    fontWeight: 600,
                    fontSize: 13,
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
