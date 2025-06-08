import React, { useCallback } from "react";
import { Handle, Position } from "reactflow";

import { StateNode, ViewerTheme } from "../types";
import { nodeTransitionStyles } from "../core/layout";
// Import specific icons instead of the whole package
import {
  IconCheck,
  IconPlayerPlay,
  IconX,
  IconLambda,
  IconListDetails,
  IconLocationQuestion,
  IconStopwatch,
  IconRosetteDiscountCheckFilled,
  IconVectorBezier,
  IconSitemap,
} from "@tabler/icons-react";

interface ReactFlowStateNodeProps {
  data: {
    stateNode: StateNode;
    theme: ViewerTheme;
    onStateClick?: (state: StateNode) => void;
  };
}

export const ReactFlowStateNode: React.FC<ReactFlowStateNodeProps> = ({
  data,
}) => {
  const { stateNode, theme, onStateClick } = data;

  const handleClick = useCallback(() => {
    onStateClick?.(stateNode);
  }, [onStateClick, stateNode]);

  const getStateIcon = (type: string): React.ReactElement => {
    const iconSize = stateNode.parentId ? "20px" : "35px"; // Smaller icons for child nodes
    const iconColor = theme.textColor;

    // Special case for the artificial start node
    if (stateNode.id === "__start__") {
      return <IconPlayerPlay size={iconSize} color={iconColor} />;
    }

    // Special case for the artificial end node
    if (stateNode.id === "__end__") {
      return <IconCheck size={iconSize} color={iconColor} />;
    }

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
    // Special color for the artificial start node
    if (stateNode.id === "__start__") {
      return theme.nodeColors.pass;
    }

    return (
      theme.nodeColors[
        stateNode.type.toLowerCase() as keyof typeof theme.nodeColors
      ] || theme.nodeColors.pass
    );
  };

  const getBorderStyle = (): string => {
    if (stateNode.id === "__start__") return `2px solid ${theme.successColor}`;
    if (stateNode.id === "__end__") return `2px solid ${theme.errorColor}`;
    return `2px solid ${theme.borderColor}`;
  };

  const getBoxShadow = (): string => {
    if (stateNode.id === "__start__")
      return `0 0 15px ${theme.successColor}40, 0 4px 8px rgba(0,0,0,0.1)`;
    if (stateNode.id === "__end__")
      return `0 0 15px ${theme.errorColor}40, 0 4px 8px rgba(0,0,0,0.1)`;
    return "0 4px 8px rgba(0,0,0,0.1)";
  };

  const getNodeStyles = (): React.CSSProperties => {
    // Special circular nodes for the artificial start and end nodes
    const isCircular =
      stateNode.id === "__start__" || stateNode.id === "__end__";

    // Child nodes have different styling
    const isChildNode = !!stateNode.parentId;

    return {
      width: "100%",
      height: "100%",
      background: getNodeColor(),
      border: getBorderStyle(),
      borderRadius: isCircular ? "50%" : "12px",
      display: "flex",
      flexDirection: isCircular ? "column" : "row",
      alignItems: "center",
      justifyContent: isCircular ? "center" : "flex-start",
      cursor:
        onStateClick &&
        stateNode.id !== "__end__" &&
        stateNode.id !== "__start__"
          ? "pointer"
          : "default",
      boxShadow: isChildNode ? "0 2px 4px rgba(0,0,0,0.1)" : getBoxShadow(),
      userSelect: "none",
      position: "relative",
      padding: isCircular ? "0" : isChildNode ? "8px" : "12px",
      gap: isCircular ? "0" : "12px",
      opacity: isChildNode ? 0.9 : 1,
      transform: isChildNode ? "scale(0.85)" : "scale(1)",
      // Enhanced transition for smooth movement
      ...nodeTransitionStyles,
    };
  };

  return (
    <>
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "transparent",
          border: `none`,
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={{
          background: "transparent",
          border: `none`,
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        style={{
          background: "transparent",
          border: `none`,
          width: 8,
          height: 8,
        }}
      />

      <div
        style={getNodeStyles()}
        onClick={
          stateNode.id !== "__end__" && stateNode.id !== "__start__"
            ? handleClick
            : undefined
        }
        onMouseEnter={(e) => {
          if (
            stateNode.id !== "__end__" &&
            stateNode.id !== "__start__" &&
            onStateClick
          ) {
            const currentTransform = stateNode.parentId
              ? "scale(0.85)"
              : "scale(1)";
            const hoverTransform = stateNode.parentId
              ? "scale(0.90)"
              : "scale(1.05)";
            e.currentTarget.style.transform = hoverTransform;
            e.currentTarget.style.boxShadow =
              stateNode.id === "__start__"
                ? `0 0 20px ${theme.successColor}60, 0 6px 12px rgba(0,0,0,0.2)`
                : stateNode.id === "__end__"
                  ? `0 0 20px ${theme.errorColor}60, 0 6px 12px rgba(0,0,0,0.2)`
                  : stateNode.parentId
                    ? "0 3px 6px rgba(0,0,0,0.15)"
                    : "0 6px 12px rgba(0,0,0,0.2)";
          }
        }}
        onMouseLeave={(e) => {
          if (
            stateNode.id !== "__end__" &&
            stateNode.id !== "__start__" &&
            onStateClick
          ) {
            const normalTransform = stateNode.parentId
              ? "scale(0.85)"
              : "scale(1)";
            e.currentTarget.style.transform = normalTransform;
            e.currentTarget.style.boxShadow = stateNode.parentId
              ? "0 2px 4px rgba(0,0,0,0.1)"
              : getBoxShadow();
          }
        }}
      >
        {/* Special handling for the artificial start and end nodes */}
        {stateNode.id === "__start__" ? (
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: theme.textColor,
              textAlign: "center",
            }}
          >
            START
          </div>
        ) : stateNode.id === "__end__" ? (
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: theme.textColor,
              textAlign: "center",
            }}
          >
            END
          </div>
        ) : (
          <>
            {/* Icon on the left */}
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

            {/* Content on the right */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minWidth: 0, // Allow text to shrink
              }}
            >
              {/* State name */}
              <div
                style={{
                  fontSize: stateNode.parentId ? "14px" : "18px",
                  fontWeight: "bold",
                  color: theme.textColor,
                  lineHeight: "1.2",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={stateNode.name} // Tooltip for full name
              >
                {stateNode.name}
              </div>

              {/* State type */}
              <div
                style={{
                  fontSize: stateNode.parentId ? "11px" : "14px",
                  color: theme.textColor,
                  opacity: 0.7,
                  marginTop: "2px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {stateNode.type}
                {stateNode.parentId && (
                  <span style={{ marginLeft: "4px", fontSize: "10px" }}>
                    {stateNode.branchIndex !== undefined
                      ? `(Branch ${stateNode.branchIndex + 1})`
                      : "(Iterator)"}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "transparent",
          border: `none`,
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "transparent",
          border: `none`,
          width: 8,
          height: 8,
        }}
      />
    </>
  );
};
