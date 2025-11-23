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
    isHighlighted?: boolean;
  };
}

export const ReactFlowStateNode: React.FC<ReactFlowStateNodeProps> = React.memo(
  ({ data }) => {
    const { stateNode, theme, onStateClick, isHighlighted } = data;

    const handleClick = useCallback(() => {
      onStateClick?.(stateNode);
    }, [onStateClick, stateNode]);

    const getStateIcon = (type: string): React.ReactElement => {
      const iconSize = stateNode.parentId ? "18px" : "24px";
      const iconColor = theme.textColor;

      if (stateNode.id === "__start__") {
        return <IconPlayerPlay size={iconSize} color={theme.successColor} />;
      }

      if (stateNode.id === "__end__") {
        return <IconCheck size={iconSize} color={theme.surfaceColor} />;
      }

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
      if (stateNode.id === "__start__") {
        return theme.surfaceColor;
      }

      if (stateNode.id === "__end__") {
        return theme.errorColor;
      }

      return (
        theme.nodeColors[
          stateNode.type.toLowerCase() as keyof typeof theme.nodeColors
        ] || theme.nodeColors.pass
      );
    };

    const getBorderColor = (): string => {
      if (stateNode.id === "__start__") return theme.successColor;
      if (stateNode.id === "__end__") return theme.errorColor;

      return (
        theme.nodeBorderColors[
          stateNode.type.toLowerCase() as keyof typeof theme.nodeBorderColors
        ] || theme.borderColor
      );
    };

    const getBoxShadow = (): string => {
      if (isHighlighted) {
        return `0 0 0 4px ${theme.nodeBorderColors.task}60, 0 8px 16px ${theme.shadowColor}`;
      }
      if (stateNode.id === "__start__")
        return `0 4px 12px ${theme.successColor}40`;
      if (stateNode.id === "__end__") return `0 4px 12px ${theme.errorColor}40`;
      return `0 2px 8px ${theme.shadowColor}, 0 1px 2px ${theme.shadowColor}`;
    };

    const isArtificial =
      stateNode.id === "__start__" || stateNode.id === "__end__";
    const isEnd = stateNode.id === "__end__";

    return (
      <div
        onClick={handleClick}
        style={{
          padding: isArtificial ? "8px" : "12px 16px",
          borderRadius: isArtificial ? "50%" : "12px",
          background: getNodeColor(),
          border: isArtificial
            ? `2px solid ${getBorderColor()}`
            : `1px solid ${theme.borderColor}`,
          borderLeft: isArtificial
            ? undefined
            : `4px solid ${getBorderColor()}`,
          color: isEnd ? theme.surfaceColor : theme.textColor,
          minWidth: isArtificial ? "auto" : "180px",
          maxWidth: isArtificial ? "auto" : "280px",
          boxShadow: getBoxShadow(),
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: isArtificial ? "center" : "flex-start",
          justifyContent: "center",
          fontSize: "14px",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          position: "relative",
          ...nodeTransitionStyles,
        }}
        className="react-flow-node-custom"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 8px 16px ${theme.shadowColor}, 0 4px 8px ${theme.shadowColor}`;
          if (!isArtificial) {
            e.currentTarget.style.background =
              theme.nodeHoverColors[
                stateNode.type.toLowerCase() as keyof typeof theme.nodeHoverColors
              ] || theme.nodeHoverColors.pass;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = getBoxShadow();
          if (!isArtificial) {
            e.currentTarget.style.background = getNodeColor();
          }
        }}
      >
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
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            marginBottom: isArtificial ? 0 : "4px",
          }}
        >
          <div
            style={{
              marginRight: isArtificial ? 0 : "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getStateIcon(stateNode.type)}
          </div>

          {!isArtificial && (
            <div
              style={{
                fontWeight: 600,
                fontSize: "14px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
              }}
            >
              {stateNode.id}
            </div>
          )}
        </div>

        {!isArtificial && stateNode.definition.Comment && (
          <div
            style={{
              fontSize: "12px",
              color: theme.textColorSecondary,
              marginTop: "4px",
              lineHeight: "1.4",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {stateNode.definition.Comment}
          </div>
        )}

        {!isArtificial && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "10px",
              color: theme.textColorMuted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <span>{stateNode.type}</span>
            {stateNode.definition.End && <span>END</span>}
          </div>
        )}

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
      </div>
    );
  },
);

ReactFlowStateNode.displayName = "ReactFlowStateNode";
