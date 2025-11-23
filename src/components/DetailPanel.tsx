import React from "react";
import { IconX, IconCopy } from "@tabler/icons-react";
import { StateNode, ViewerTheme } from "../types";

interface DetailPanelProps {
  node: StateNode;
  theme: ViewerTheme;
  onClose: () => void;
}

const DetailSection: React.FC<{
  title: string;
  children: React.ReactNode;
  theme: ViewerTheme;
}> = ({ title, children, theme }) => (
  <div style={{ marginBottom: "16px" }}>
    <div
      style={{
        fontSize: "11px",
        fontWeight: "bold",
        textTransform: "uppercase",
        color: theme.textColorSecondary,
        marginBottom: "8px",
        borderBottom: `1px solid ${theme.borderColor}`,
        paddingBottom: "4px",
        letterSpacing: "0.5px",
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: "12px" }}>{children}</div>
  </div>
);

const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  theme: ViewerTheme;
}> = ({ label, value, theme }) => (
  <div
    style={{ marginBottom: "6px", display: "flex", flexDirection: "column" }}
  >
    <span
      style={{
        fontWeight: 600,
        color: theme.textColorSecondary,
        fontSize: "11px",
        marginBottom: "2px",
      }}
    >
      {label}:
    </span>
    <span
      style={{
        color: theme.textColor,
        wordBreak: "break-word",
        lineHeight: "1.4",
      }}
    >
      {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
    </span>
  </div>
);

const JsonView: React.FC<{ data: any; theme: ViewerTheme }> = ({
  data,
  theme,
}) => (
  <pre
    style={{
      background: theme.background === "#ffffff" ? "#f8f9fa" : "#1e1e1e",
      padding: "8px",
      borderRadius: "4px",
      fontSize: "10px",
      overflowX: "auto",
      border: `1px solid ${theme.borderColor}`,
      margin: "4px 0 0 0",
      fontFamily: "monospace",
      color: theme.textColor,
    }}
  >
    {JSON.stringify(data, null, 2)}
  </pre>
);

export const DetailPanel: React.FC<DetailPanelProps> = ({
  node,
  theme,
  onClose,
}) => {
  const def = node.definition;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(node.definition, null, 2));
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: "350px",
        backgroundColor: theme.surfaceColor,
        borderLeft: `1px solid ${theme.borderColor}`,
        boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid ${theme.borderColor}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 600,
              color: theme.textColor,
            }}
          >
            {node.name}
          </h3>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor:
                  theme.nodeBorderColors[
                    node.type.toLowerCase() as keyof typeof theme.nodeBorderColors
                  ] || theme.borderColor,
                color: "#fff",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              {node.type}
            </span>
            {node.isStartState && (
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: theme.successColor,
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >
                START
              </span>
            )}
            {node.isEndState && (
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor:
                    node.type === "Succeed"
                      ? theme.successColor
                      : theme.errorColor,
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >
                END
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={handleCopy}
            title="Copy JSON"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.textColorSecondary,
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCopy size={20} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.textColorSecondary,
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconX size={20} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* General */}
        {def.Comment && (
          <DetailSection title="Description" theme={theme}>
            <div style={{ fontStyle: "italic", lineHeight: "1.4" }}>
              {def.Comment}
            </div>
          </DetailSection>
        )}

        {/* Configuration */}
        {(def.Resource ||
          def.TimeoutSeconds !== undefined ||
          def.HeartbeatSeconds !== undefined) && (
          <DetailSection title="Configuration" theme={theme}>
            {def.Resource && (
              <DetailRow label="Resource" value={def.Resource} theme={theme} />
            )}
            {def.TimeoutSeconds !== undefined && (
              <DetailRow
                label="Timeout"
                value={`${def.TimeoutSeconds}s`}
                theme={theme}
              />
            )}
            {def.HeartbeatSeconds !== undefined && (
              <DetailRow
                label="Heartbeat"
                value={`${def.HeartbeatSeconds}s`}
                theme={theme}
              />
            )}
          </DetailSection>
        )}

        {/* Type Specific */}
        {(node.type === "Wait" ||
          node.type === "Map" ||
          node.type === "Parallel" ||
          node.type === "Fail") && (
          <DetailSection title={`${node.type} Details`} theme={theme}>
            {/* Wait */}
            {def.Seconds !== undefined && (
              <DetailRow label="Seconds" value={def.Seconds} theme={theme} />
            )}
            {def.Timestamp && (
              <DetailRow
                label="Timestamp"
                value={def.Timestamp}
                theme={theme}
              />
            )}
            {def.SecondsPath && (
              <DetailRow
                label="SecondsPath"
                value={def.SecondsPath}
                theme={theme}
              />
            )}
            {def.TimestampPath && (
              <DetailRow
                label="TimestampPath"
                value={def.TimestampPath}
                theme={theme}
              />
            )}

            {/* Map */}
            {def.ItemsPath && (
              <DetailRow
                label="ItemsPath"
                value={def.ItemsPath}
                theme={theme}
              />
            )}
            {def.MaxConcurrency !== undefined && (
              <DetailRow
                label="MaxConcurrency"
                value={def.MaxConcurrency}
                theme={theme}
              />
            )}

            {/* Fail */}
            {def.Error && (
              <DetailRow label="Error" value={def.Error} theme={theme} />
            )}
            {def.Cause && (
              <DetailRow label="Cause" value={def.Cause} theme={theme} />
            )}
            {def.Branches && (
              <DetailRow
                label="Branches"
                value={def.Branches.length}
                theme={theme}
              />
            )}
          </DetailSection>
        )}

        {/* Data Flow */}
        {(def.InputPath ||
          def.OutputPath ||
          def.ResultPath ||
          def.Parameters ||
          def.ResultSelector ||
          def.Result) && (
          <DetailSection title="Data Flow" theme={theme}>
            {def.InputPath && (
              <DetailRow
                label="InputPath"
                value={def.InputPath}
                theme={theme}
              />
            )}
            {def.Parameters && (
              <div style={{ marginBottom: "8px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: theme.textColorSecondary,
                    fontSize: "11px",
                  }}
                >
                  Parameters:
                </span>
                <JsonView data={def.Parameters} theme={theme} />
              </div>
            )}
            {def.ResultSelector && (
              <div style={{ marginBottom: "8px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: theme.textColorSecondary,
                    fontSize: "11px",
                  }}
                >
                  ResultSelector:
                </span>
                <JsonView data={def.ResultSelector} theme={theme} />
              </div>
            )}
            {def.Result && (
              <div style={{ marginBottom: "8px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: theme.textColorSecondary,
                    fontSize: "11px",
                  }}
                >
                  Result:
                </span>
                <JsonView data={def.Result} theme={theme} />
              </div>
            )}
            {def.ResultPath && (
              <DetailRow
                label="ResultPath"
                value={def.ResultPath}
                theme={theme}
              />
            )}
            {def.OutputPath && (
              <DetailRow
                label="OutputPath"
                value={def.OutputPath}
                theme={theme}
              />
            )}
          </DetailSection>
        )}

        {/* Error Handling */}
        {(def.Retry || def.Catch) && (
          <DetailSection title="Error Handling" theme={theme}>
            {def.Retry && (
              <div style={{ marginBottom: "4px" }}>
                <span
                  style={{ fontWeight: 600, color: theme.textColorSecondary }}
                >
                  Retries:
                </span>{" "}
                {def.Retry.length} defined
              </div>
            )}
            {def.Catch && (
              <div>
                <span
                  style={{ fontWeight: 600, color: theme.textColorSecondary }}
                >
                  Catchers:
                </span>{" "}
                {def.Catch.length} defined
              </div>
            )}
          </DetailSection>
        )}

        {/* Flow */}
        <DetailSection title="Flow Control" theme={theme}>
          {def.Next && (
            <DetailRow label="Next" value={def.Next} theme={theme} />
          )}
          {def.Default && (
            <DetailRow label="Default" value={def.Default} theme={theme} />
          )}
          {def.End && <DetailRow label="End" value="True" theme={theme} />}
        </DetailSection>

        {/* Raw JSON */}
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: theme.textColorSecondary,
              }}
            >
              Raw Definition
            </h4>
          </div>
          <pre
            style={{
              margin: 0,
              padding: "12px",
              backgroundColor: theme.background,
              borderRadius: "6px",
              fontSize: "0.85rem",
              color: theme.textColor,
              overflowX: "auto",
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            {JSON.stringify(node.definition, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
