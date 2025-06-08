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

export const ReactFlowGroupNode: React.FC<ReactFlowGroupNodeProps> = ({
  data,
}) => {
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
    const iconSize = "35px";
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
      case "Parallel":
        return <IconVectorBezier color={iconColor} size={iconSize} />;
      case "Map":
        return <IconSitemap color={iconColor} size={iconSize} />;
      default:
        return <IconLambda color={"#ed7100"} size={iconSize} />;
    }
  };

  const getNodeColor = (): string => {
    return (
      theme.nodeColors[
        stateNode.type.toLowerCase() as keyof typeof theme.nodeColors
      ] || theme.nodeColors.pass
    );
  };

  const getBorderStyle = (): string => {
    return `2px solid ${theme.borderColor}`;
  };

  const getBoxShadow = (): string => {
    return "0 4px 8px rgba(0,0,0,0.1)";
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
          width: 8,
          height: 8,
        }}
      />

      {/* Group container */}
      <div
        onClick={handleClick}
        style={{
          width: "100%",
          height: "100%",
          background: stateNode.isExpanded
            ? "rgba(0,0,0,0.02)"
            : getNodeColor(),
          border: getBorderStyle(),
          borderRadius: "12px",
          display: "flex",
          flexDirection: stateNode.isExpanded ? "column" : "row",
          alignItems: stateNode.isExpanded ? "stretch" : "center",
          justifyContent: stateNode.isExpanded ? "flex-start" : "flex-start",
          cursor: onStateClick ? "pointer" : "default",
          boxShadow: getBoxShadow(),
          userSelect: "none",
          position: "relative",
          padding: stateNode.isExpanded ? "8px" : "12px",
          gap: stateNode.isExpanded ? "8px" : "12px",
          // Enhanced transition for smooth expansion/contraction
          ...nodeTransitionStyles,
        }}
        onMouseEnter={(e) => {
          if (onStateClick) {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
          }
        }}
        onMouseLeave={(e) => {
          if (onStateClick) {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = getBoxShadow();
          }
        }}
      >
        {/* Parent node header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: stateNode.isExpanded ? getNodeColor() : "transparent",
            borderRadius: stateNode.isExpanded ? "8px" : "0",
            padding: stateNode.isExpanded ? "8px 12px" : "0",
            minHeight: stateNode.isExpanded ? "auto" : "100%",
            flex: stateNode.isExpanded ? "0 0 auto" : "1",
          }}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={handleToggleExpand}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            {stateNode.isExpanded ? (
              <IconChevronDown size="16px" color={theme.textColor} />
            ) : (
              <IconChevronRight size="16px" color={theme.textColor} />
            )}
          </button>

          {/* Icon */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: theme.textColor,
            }}
          >
            {getStateIcon(stateNode.type)}
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            {/* State name */}
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: theme.textColor,
                lineHeight: "1.2",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={stateNode.name}
            >
              {stateNode.name}
            </div>

            {/* State type */}
            <div
              style={{
                fontSize: "14px",
                color: theme.textColor,
                opacity: 0.7,
                marginTop: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {stateNode.type}
              {stateNode.children && (
                <span style={{ marginLeft: "8px", fontSize: "12px" }}>
                  ({stateNode.children.length}{" "}
                  {stateNode.type === "Parallel" ? "branches" : "states"})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Children container (only visible when expanded) */}
        {stateNode.isExpanded && stateNode.children && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: stateNode.type === "Parallel" ? "row" : "column",
              gap: "8px",
              padding: "8px",
              background: "rgba(255,255,255,0.5)",
              borderRadius: "8px",
              border: `1px dashed ${theme.borderColor}`,
              minHeight: "100px",
              alignItems:
                stateNode.type === "Parallel" ? "flex-start" : "stretch",
              justifyContent:
                stateNode.type === "Parallel" ? "space-around" : "flex-start",
            }}
          >
            {stateNode.type === "Parallel"
              ? // Group children by branch for Parallel
                (() => {
                  const branches = new Map<number, typeof stateNode.children>();
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
                          gap: "4px",
                          flex: 1,
                          minWidth: "120px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: theme.textColor,
                            opacity: 0.8,
                            marginBottom: "4px",
                            textAlign: "center",
                          }}
                        >
                          Branch {branchIndex + 1}
                        </div>
                        {branchChildren.map((child) => (
                          <ChildNodeDisplay
                            key={child.id}
                            child={child}
                            theme={theme}
                            onStateClick={onStateClick}
                          />
                        ))}
                      </div>
                    ),
                  );
                })()
              : // Simple list for Map
                stateNode.children.map((child) => (
                  <ChildNodeDisplay
                    key={child.id}
                    child={child}
                    theme={theme}
                    onStateClick={onStateClick}
                  />
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
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "transparent",
          border: "none",
          width: 8,
          height: 8,
        }}
      />
    </>
  );
};

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
