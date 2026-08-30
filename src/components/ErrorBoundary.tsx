"use client";

import React, { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
    this.props.onError?.(error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div
          className="glass"
          style={{
            border: "1px solid var(--status-danger-border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-8)",
            textAlign: "center",
            margin: "var(--space-6) auto",
            maxWidth: 600,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: "var(--space-2)" }}>⚠️</div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "var(--space-2)", color: "var(--status-danger)" }}>
            Something interrupted the audit view
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-5)", lineHeight: 1.6 }}>
            {this.state.error.message || "An unhandled UI state occurred. You can safely retry without losing saved data."}
          </p>
          <button
            onClick={this.reset}
            type="button"
            style={{
              background: "var(--status-danger)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "12px 24px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "var(--text-sm)",
            }}
          >
            ↻ Recover View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
