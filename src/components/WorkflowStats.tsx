import React from "react";
import { ViewerTheme, ASLDefinition } from "../types";
import { WorkflowStatistics, getWorkflowStatistics } from "../core/statistics";
import {
  IconChartBar,
  IconX,
  IconAlertTriangle,
  IconShieldCheck,
  IconArrowsSplit,
  IconRoute,
  IconRefresh,
} from "@tabler/icons-react";

interface WorkflowStatsProps {
  definition: ASLDefinition;
  theme: ViewerTheme;
  onClose: () => void;
}

export const WorkflowStats: React.FC<WorkflowStatsProps> = ({
  definition,
  theme,
  onClose,
}) => {
  const stats: WorkflowStatistics = getWorkflowStatistics(definition);

  const getComplexityColor = (score: number): string => {
    if (score <= 3) return theme.successColor;
    if (score <= 6) return theme.warningColor;
    return theme.errorColor;
  };

  const getComplexityLabel = (score: number): string => {
    if (score <= 3) return "Simple";
    if (score <= 6) return "Moderate";
    return "Complex";
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: "360px",
        background: theme.surfaceColor,
        borderRight: `1px solid ${theme.borderColor}`,
        zIndex: 20,
        overflowY: "auto",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: theme.textColor,
        boxShadow: `4px 0 12px ${theme.shadowColor || "rgba(0,0,0,0.1)"}`,
      }}
      data-testid="workflow-stats"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          borderBottom: `1px solid ${theme.borderColor}`,
          background: theme.background,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <IconChartBar size={20} color={theme.infoColor} />
          <span style={{ fontWeight: 600, fontSize: "16px" }}>
            Workflow Statistics
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: theme.textColorSecondary,
            padding: "4px",
            borderRadius: "4px",
          }}
          aria-label="Close statistics"
        >
          <IconX size={18} />
        </button>
      </div>

      {/* Complexity Score */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid ${theme.borderColor}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: theme.textColorSecondary,
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Complexity Score
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: `3px solid ${getComplexityColor(stats.complexityScore)}`,
            fontSize: "24px",
            fontWeight: "bold",
            color: getComplexityColor(stats.complexityScore),
            marginBottom: "4px",
          }}
        >
          {stats.complexityScore}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: getComplexityColor(stats.complexityScore),
          }}
        >
          {getComplexityLabel(stats.complexityScore)}
        </div>
      </div>

      {/* Overview */}
      <div style={{ padding: "16px" }}>
        <SectionTitle theme={theme}>Overview</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <StatCard
            label="Total States"
            value={stats.totalStates}
            theme={theme}
          />
          <StatCard
            label="Connections"
            value={stats.totalConnections}
            theme={theme}
          />
          <StatCard label="Max Depth" value={stats.maxDepth} theme={theme} />
          <StatCard
            label="End States"
            value={stats.terminalStates.length}
            theme={theme}
          />
        </div>
      </div>

      {/* State Types Breakdown */}
      <div style={{ padding: "0 16px 16px" }}>
        <SectionTitle theme={theme}>State Types</SectionTitle>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {Object.entries(stats.stateTypeCounts)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => (
              <div
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: theme.background,
                  borderRadius: "6px",
                  border: `1px solid ${theme.borderColor}`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background:
                        theme.nodeColors[
                          type.toLowerCase() as keyof typeof theme.nodeColors
                        ] || theme.infoColor,
                    }}
                  />
                  <span style={{ fontSize: "13px" }}>{type}</span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: `${Math.max(20, (count / stats.totalStates) * 100)}px`,
                      height: "4px",
                      borderRadius: "2px",
                      background:
                        theme.nodeBorderColors[
                          type.toLowerCase() as keyof typeof theme.nodeBorderColors
                        ] || theme.infoColor,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      minWidth: "20px",
                      textAlign: "right",
                    }}
                  >
                    {count}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Error Handling */}
      <div style={{ padding: "0 16px 16px" }}>
        <SectionTitle theme={theme}>
          <IconShieldCheck size={16} color={theme.infoColor} />
          Error Handling
        </SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <StatRow
            label="Error handlers (Retry + Catch)"
            value={`${stats.errorHandlingCount}`}
            theme={theme}
          />
          <StatRow
            label="States with error handling"
            value={`${stats.statesWithErrorHandling.length}`}
            theme={theme}
          />
          {stats.statesWithErrorHandling.length > 0 && (
            <div
              style={{
                padding: "8px",
                background: theme.background,
                borderRadius: "4px",
                fontSize: "12px",
                color: theme.textColorSecondary,
              }}
            >
              {stats.statesWithErrorHandling.join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Parallel Execution */}
      {stats.parallelBranchCount > 0 && (
        <div style={{ padding: "0 16px 16px" }}>
          <SectionTitle theme={theme}>
            <IconArrowsSplit size={16} color={theme.infoColor} />
            Parallel Execution
          </SectionTitle>
          <StatRow
            label="Total branches"
            value={`${stats.parallelBranchCount}`}
            theme={theme}
          />
        </div>
      )}

      {/* Cycles */}
      <div style={{ padding: "0 16px 16px" }}>
        <SectionTitle theme={theme}>
          <IconRefresh
            size={16}
            color={stats.hasCycles ? theme.warningColor : theme.successColor}
          />
          Cycles
        </SectionTitle>
        {stats.hasCycles ? (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px",
                background: `${theme.warningColor}15`,
                border: `1px solid ${theme.warningColor}40`,
                borderRadius: "6px",
                fontSize: "13px",
                color: theme.warningColor,
                marginBottom: "8px",
              }}
            >
              <IconAlertTriangle size={14} />
              {stats.cyclicPaths.length} cycle(s) detected
            </div>
            {stats.cyclicPaths.map((path, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 8px",
                  background: theme.background,
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: theme.textColorSecondary,
                  fontFamily: "monospace",
                  marginBottom: "4px",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                <IconRoute size={12} style={{ marginRight: "4px" }} />
                {path.join(" → ")}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px",
              background: `${theme.successColor}15`,
              border: `1px solid ${theme.successColor}40`,
              borderRadius: "6px",
              fontSize: "13px",
              color: theme.successColor,
            }}
          >
            <IconShieldCheck size={14} />
            No cycles detected (DAG)
          </div>
        )}
      </div>

      {/* Terminal States */}
      {stats.terminalStates.length > 0 && (
        <div style={{ padding: "0 16px 16px" }}>
          <SectionTitle theme={theme}>Terminal States</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {stats.terminalStates.map((state) => (
              <span
                key={state}
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  background: theme.background,
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: theme.textColorSecondary,
                }}
              >
                {state}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const SectionTitle: React.FC<{
  theme: ViewerTheme;
  children: React.ReactNode;
}> = ({ theme, children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: theme.textColorSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "10px",
    }}
  >
    {children}
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  theme: ViewerTheme;
}> = ({ label, value, theme }) => (
  <div
    style={{
      padding: "12px",
      background: theme.background,
      borderRadius: "8px",
      border: `1px solid ${theme.borderColor}`,
      textAlign: "center",
    }}
  >
    <div
      style={{ fontSize: "24px", fontWeight: "bold", color: theme.textColor }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "11px",
        color: theme.textColorSecondary,
        marginTop: "2px",
      }}
    >
      {label}
    </div>
  </div>
);

const StatRow: React.FC<{
  label: string;
  value: string;
  theme: ViewerTheme;
}> = ({ label, value, theme }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      background: theme.background,
      borderRadius: "6px",
      border: `1px solid ${theme.borderColor}`,
    }}
  >
    <span style={{ fontSize: "13px", color: theme.textColorSecondary }}>
      {label}
    </span>
    <span style={{ fontSize: "13px", fontWeight: 600, color: theme.textColor }}>
      {value}
    </span>
  </div>
);
