import React, { useState } from "react";
import { ValidationError, ViewerTheme } from "../types";

interface ErrorDisplayProps {
  errors: ValidationError[];
  theme: ViewerTheme;
  width: number;
  height: number;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errors,
  theme,
  width,
  height,
}) => {
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  const toggleErrorExpansion = (index: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedErrors(newExpanded);
  };

  const getSeverityIcon = (severity: "error" | "warning") => {
    return severity === "error" ? "🚨" : "⚠️";
  };

  const getSeverityColor = (severity: "error" | "warning") => {
    return severity === "error" ? theme.errorColor : "#ff9800";
  };

  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.nodeColors.task} 100%)`,
        border: `2px solid ${theme.borderColor}`,
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        color: theme.textColor,
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1)`,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "20px",
          fontWeight: "600",
          marginBottom: "16px",
          color: theme.errorColor,
          display: "flex",
          alignItems: "center",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        }}
      >
        <span 
          style={{ 
            marginRight: "12px", 
            fontSize: "24px",
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))"
          }}
        >
          🛠️
        </span>
        Workflow Validation Issues
      </div>

      <div 
        style={{ 
          marginBottom: "20px", 
          fontSize: "14px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        {errorCount > 0 && (
          <div
            style={{
              background: `${theme.errorColor}20`,
              color: theme.errorColor,
              padding: "8px 12px",
              borderRadius: "20px",
              border: `1px solid ${theme.errorColor}40`,
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🚨</span>
            {errorCount} error{errorCount !== 1 ? "s" : ""}
          </div>
        )}
        {warningCount > 0 && (
          <div
            style={{
              background: "#ff980020",
              color: "#ff9800",
              padding: "8px 12px",
              borderRadius: "20px",
              border: "1px solid #ff980040",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚠️</span>
            {warningCount} warning{warningCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: `linear-gradient(145deg, ${theme.background}, ${theme.nodeColors.pass})`,
          borderRadius: "8px",
          padding: "16px",
          border: `1px solid ${theme.borderColor}20`,
          boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
        }}
      >
        {errors.map((error, index) => (
          <div
            key={index}
            style={{
              marginBottom: "12px",
              background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.nodeColors.task} 100%)`,
              borderLeft: `6px solid ${getSeverityColor(error.severity)}`,
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onClick={() => toggleErrorExpansion(index)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div style={{ padding: "12px 16px" }}>
              <div
                style={{
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: getSeverityColor(error.severity),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>
                    {getSeverityIcon(error.severity)}
                  </span>
                  <span>{error.severity.toUpperCase()}</span>
                  <span 
                    style={{ 
                      color: theme.textColor, 
                      opacity: 0.7,
                      fontWeight: "400",
                      fontSize: "12px",
                      background: `${theme.borderColor}20`,
                      padding: "2px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    {error.path}
                  </span>
                </div>
                <span 
                  style={{ 
                    fontSize: "12px", 
                    opacity: 0.6,
                    transform: expandedErrors.has(index) ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ▼
                </span>
              </div>
              
              <div
                style={{
                  color: theme.textColor,
                  fontSize: "13px",
                  lineHeight: "1.5",
                  background: `${theme.background}80`,
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.borderColor}30`,
                }}
              >
                {error.message}
              </div>
              
              {expandedErrors.has(index) && (error.line !== undefined || error.column !== undefined) && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    background: `${getSeverityColor(error.severity)}10`,
                    borderRadius: "6px",
                    border: `1px solid ${getSeverityColor(error.severity)}20`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: getSeverityColor(error.severity),
                      marginBottom: "4px",
                    }}
                  >
                    📍 Location Details
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: theme.textColor,
                      opacity: 0.8,
                      fontFamily: "monospace",
                    }}
                  >
                    Line: {error.line || "?"}, Column: {error.column || "?"}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "16px",
          padding: "12px 16px",
          background: `linear-gradient(135deg, ${theme.nodeColors.choice} 0%, ${theme.nodeColors.pass} 100%)`,
          borderRadius: "8px",
          border: `1px solid ${theme.borderColor}40`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "500",
            color: theme.textColor,
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>💡</span>
          Action Required
        </div>
        <div
          style={{
            fontSize: "12px",
            opacity: 0.8,
            color: theme.textColor,
            lineHeight: "1.4",
          }}
        >
          Please fix the issues above to view the workflow diagram.
        </div>
      </div>
    </div>
  );
};
