import React from "react";

export default function ResultsSkeleton() {
  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
      aria-label="Loading results skeleton"
    >
      {/* Metric Cards Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass shimmer"
            style={{
              height: 120,
              borderRadius: "var(--radius-lg)",
            }}
          />
        ))}
      </div>

      {/* AI Summary Banner Skeleton */}
      <div
        className="glass shimmer"
        style={{
          height: 100,
          borderRadius: "var(--radius-lg)",
          width: "100%",
        }}
      />

      {/* Tool Recommendations Skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass shimmer"
            style={{
              height: 90,
              borderRadius: "var(--radius-lg)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
