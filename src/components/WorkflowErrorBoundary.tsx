import React from "react";
import { ViewerTheme } from "../types";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

interface ErrorBoundaryProps {
  theme?: ViewerTheme;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches rendering errors and shows a fallback UI.
 * Prevents the entire application from crashing when the workflow viewer encounters an error.
 */
export class WorkflowErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(
      "WorkflowViewer Error Boundary caught an error:",
      error,
      errorInfo,
    );
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const theme = this.props.theme;
      const bgColor = theme?.surfaceColor || "#fff";
      const textColor = theme?.textColor || "#1e293b";
      const textSecondary = theme?.textColorSecondary || "#64748b";
      const errorColor = theme?.errorColor || "#dc2626";
      const borderColor = theme?.borderColor || "#e2e8f0";

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            background: bgColor,
            color: textColor,
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            height: "100%",
            minHeight: "200px",
          }}
          data-testid="error-boundary-fallback"
        >
          <IconAlertTriangle size={48} color={errorColor} />
          <h3
            style={{
              margin: "16px 0 8px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Something went wrong
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: textSecondary,
              textAlign: "center",
              maxWidth: "400px",
              margin: "0 0 16px",
            }}
          >
            An unexpected error occurred while rendering the workflow viewer.
          </p>
          {this.state.error && (
            <div
              style={{
                padding: "12px",
                background: `${errorColor}10`,
                border: `1px solid ${errorColor}30`,
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: errorColor,
                maxWidth: "400px",
                wordBreak: "break-word",
                marginBottom: "16px",
              }}
            >
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: "transparent",
              border: `1px solid ${borderColor}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              color: textColor,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${borderColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <IconRefresh size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
