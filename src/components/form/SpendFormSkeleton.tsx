import React from "react";

export default function SpendFormSkeleton() {
  return (
    <div
      className="glass"
      style={{
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-8)",
        maxWidth: 720,
        margin: "0 auto",
      }}
      aria-label="Loading form skeleton"
    >
      {/* Title skeleton */}
      <div className="shimmer" style={{ height: 32, width: "60%", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)" }} />
      <div className="shimmer" style={{ height: 18, width: "85%", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-8)" }} />

      {/* Inputs skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="shimmer" style={{ height: 48, borderRadius: "var(--radius-md)" }} />
        <div className="shimmer" style={{ height: 48, borderRadius: "var(--radius-md)" }} />
      </div>

      {/* Tool card skeleton list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer"
            style={{
              height: 68,
              borderRadius: "var(--radius-md)",
              width: "100%",
            }}
          />
        ))}
      </div>

      {/* Button skeleton */}
      <div className="shimmer" style={{ height: 52, borderRadius: "var(--radius-lg)", width: "100%" }} />
    </div>
  );
}
