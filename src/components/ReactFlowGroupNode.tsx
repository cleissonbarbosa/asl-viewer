import React, { useCallback } from "react";
import { Handle, Position } from "reactflow";
import { StateNode, ViewerTheme } from "../types";
import { nodeTransitionStyles } from "../core/layout";
import {
  IconX,
  IconLambda,
  IconListDetails,
  IconLocationQuestion,
  IconStopwatch,
  IconRosetteDiscountCheckFilled,
  IconVectorBezier,
  IconSitemap,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";

interface ReactFlowGroupNodeProps {
  data: {
    stateNode: StateNode;
    theme: ViewerTheme;
    onStateClick?: (state: StateNode) => void;
    onToggleExpand?: (nodeId: string) => void;
  };
}

export const ReactFlowGroupNode: React.FC<ReactFlowGroupNodeProps> = React.memo(
  ({ data }) => {
    const { stateNode, theme, onStateClick, onToggleExpand } = data;

    const handleClick = useCallback(() => {
      onStateClick?.(stateNode);
    }, [onStateClick, stateNode]);

    const handleToggleExpand = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleExpand?.(stateNode.id);
      },
      [onToggleExpand, stateNode.id],
    );

    const getStateIcon = (type: string): React.ReactElement => {
      const iconSize = "20px";
      const iconColor = theme.textColor;

      switch (type) {
        case "Pass":
          return <IconListDetails color={theme.infoColor} size={iconSize} />;
        case "Task":
          return <IconLambda color={theme.infoColor} size={iconSize} />;
        case "Choice":
          return (
            <IconLocationQuestion color={theme.warningColor} size={iconSize} />
          );
        case "Wait":
          return (
            <IconStopwatch
              color={theme.nodeBorderColors.wait}
              size={iconSize}
            />
          );
        case "Succeed":
          return (
            <IconRosetteDiscountCheckFilled
              size={iconSize}
              color={theme.successColor}
            />
          );
        case "Fail":
          return <IconX size={iconSize} color={theme.errorColor} />;
        case "Parallel":
          return (
            <IconVectorBezier
              color={theme.nodeBorderColors.parallel}
              size={iconSize}
            />
          );
        case "Map":
          return (
            <IconSitemap color={theme.nodeBorderColors.map} size={iconSize} />
          );
        default:
          return <IconLambda color={theme.infoColor} size={iconSize} />;
      }
    };

    const getNodeColor = (): string => {
      return (
        theme.nodeColors[
          stateNode.type.toLowerCase() as keyof typeof theme.nodeColors
        ] || theme.nodeColors.pass
      );
    };

    const getBorderColor = (): string => {
      return (
        theme.nodeBorderColors[
          stateNode.type.toLowerCase() as keyof typeof theme.nodeBorderColors
        ] || theme.borderColor
      );
    };

    const getBoxShadow = (): string => {
      return `0 4px 12px ${theme.shadowColor}, 0 1px 2px ${theme.shadowColor}`;
    };

    return (
      <>
        {/* Input handles */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: "transparent",
            border: "none",
            width: 1,
            height: 1,
            top: -2,
          }}
        />

        <div
          onClick={handleClick}
          style={{
            minWidth: "260px",
            minHeight: "80px",
            background: `${getNodeColor()}80`, // More transparent background
            border: `2px dashed ${getBorderColor()}`, // Dashed border for group
            borderRadius: "8px",
            boxShadow: "none", // Remove shadow for cleaner look
            padding: "12px",
            position: "relative",
            cursor: "pointer",
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            ...nodeTransitionStyles,
          }}
          className="react-flow-group-node-custom"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.textColor;
            e.currentTarget.style.background = getNodeColor();
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = getBorderColor();
            e.currentTarget.style.background = `${getNodeColor()}80`;
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
              paddingBottom: "8px",
              borderBottom: `1px solid ${theme.borderColor}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ marginRight: "8px" }}>
                {getStateIcon(stateNode.type)}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: theme.textColor,
                }}
              >
                {stateNode.id}
              </div>
            </div>

            <div
              onClick={handleToggleExpand}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                background: theme.background,
                cursor: "pointer",
                color: theme.textColorSecondary,
                transition: "background 0.2s",
                border: `1px solid ${theme.borderColor}`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = theme.borderColor)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = theme.background)
              }
            >
              {stateNode.isExpanded ? (
                <IconChevronDown size={16} />
              ) : (
                <IconChevronRight size={16} />
              )}
            </div>
          </div>

          {stateNode.definition.Comment && (
            <div
              style={{
                fontSize: "12px",
                color: theme.textColorSecondary,
                marginBottom: "8px",
                lineHeight: "1.4",
                fontStyle: "italic",
              }}
            >
              {stateNode.definition.Comment}
            </div>
          )}

          {!stateNode.isExpanded && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                color: theme.textColorMuted,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "4px",
                background: theme.background,
                borderRadius: "4px",
              }}
            >
              <span>{stateNode.children?.length || 0} Steps Inside</span>
            </div>
          )}

          {/* Children container (only visible when expanded) */}
          {stateNode.isExpanded && stateNode.children && (
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                flexDirection: stateNode.type === "Parallel" ? "row" : "column",
                gap: "12px",
                padding: "8px",
                background: theme.background,
                borderRadius: "6px",
                border: `1px solid ${theme.borderColor}`,
                minHeight: "60px",
                alignItems:
                  stateNode.type === "Parallel" ? "flex-start" : "stretch",
                justifyContent:
                  stateNode.type === "Parallel" ? "space-around" : "flex-start",
              }}
            >
              {stateNode.type === "Parallel"
                ? // Group children by branch for Parallel
                  (() => {
                    const branches = new Map<
                      number,
                      typeof stateNode.children
                    >();
                    stateNode.children.forEach((child) => {
                      const branchIndex = child.branchIndex ?? 0;
                      if (!branches.has(branchIndex)) {
                        branches.set(branchIndex, []);
                      }
                      branches.get(branchIndex)!.push(child);
                    });

                    return Array.from(branches.entries()).map(
                      ([branchIndex, branchChildren]) => (
                        <div
                          key={branchIndex}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            flex: 1,
                            minWidth: "140px",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: theme.textColorMuted,
                              marginBottom: "4px",
                              textAlign: "center",
                              textTransform: "uppercase",
                              borderBottom: `1px dashed ${theme.borderColor}`,
                              paddingBottom: "2px",
                            }}
                          >
                            Branch {branchIndex + 1}
                          </div>
                          {branchChildren.map((child, index) => (
                            <React.Fragment key={child.id}>
                              <ChildNodeDisplay
                                child={child}
                                theme={theme}
                                onStateClick={onStateClick}
                              />
                              {index < branchChildren.length - 1 && (
                                <div
                                  style={{
                                    height: "12px",
                                    width: "2px",
                                    background: theme.borderColor,
                                    margin: "0 auto",
                                  }}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ),
                    );
                  })()
                : // Simple list for Map
                  stateNode.children.map((child, index) => (
                    <React.Fragment key={child.id}>
                      <ChildNodeDisplay
                        child={child}
                        theme={theme}
                        onStateClick={onStateClick}
                      />
                      {index < (stateNode.children?.length || 0) - 1 && (
                        <div
                          style={{
                            height: "12px",
                            width: "2px",
                            background: theme.borderColor,
                            margin: "0 auto",
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
            </div>
          )}
        </div>

        {/* Output handles */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: "transparent",
            border: "none",
            width: 1,
            height: 1,
            bottom: -2,
          }}
        />
      </>
    );
  },
);

ReactFlowGroupNode.displayName = "ReactFlowGroupNode";

// Component for displaying child nodes
const ChildNodeDisplay: React.FC<{
  child: StateNode;
  theme: ViewerTheme;
  onStateClick?: (state: StateNode) => void;
}> = ({ child, theme, onStateClick }) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStateClick?.(child);
    },
    [onStateClick, child],
  );

  const getChildIcon = (type: string): React.ReactElement => {
    const iconSize = "16px";
    const iconColor = theme.textColor;

    switch (type) {
      case "Pass":
        return <IconListDetails color={theme.infoColor} size={iconSize} />;
      case "Task":
        return <IconLambda color={"#ed7100"} size={iconSize} />;
      case "Choice":
        return <IconLocationQuestion color={iconColor} size={iconSize} />;
      case "Wait":
        return <IconStopwatch color={iconColor} size={iconSize} />;
      case "Succeed":
        return (
          <IconRosetteDiscountCheckFilled size={iconSize} color="#16a34a" />
        );
      case "Fail":
        return <IconX size={iconSize} color="#dc2626" />;
      default:
        return <IconLambda color={"#ed7100"} size={iconSize} />;
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 8px",
        background:
          theme.nodeColors[
            child.type.toLowerCase() as keyof typeof theme.nodeColors
          ] || theme.nodeColors.pass,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: "6px",
        cursor: onStateClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        fontSize: "12px",
      }}
      onMouseEnter={(e) => {
        if (onStateClick) {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        }
      }}
      onMouseLeave={(e) => {
        if (onStateClick) {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {getChildIcon(child.type)}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: "bold",
            color: theme.textColor,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={child.name}
        >
          {child.name}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: theme.textColor,
            opacity: 0.7,
            textTransform: "uppercase",
          }}
        >
          {child.type}
        </div>
      </div>
    </div>
  );
};
