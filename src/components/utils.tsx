import {
  IconCheck,
  IconJumpRope,
  IconLambda,
  IconListDetails,
  IconPlayerPlay,
  IconProgressHelp,
  IconRosetteDiscountCheckFilled,
  IconSitemap,
  IconStopwatch,
  IconVectorBezier,
  IconX,
} from "@tabler/icons-react";
import { StateNode, ViewerTheme } from "../types";

export const getStateIcon = (
  stateNode: StateNode,
  theme: ViewerTheme,
): React.ReactElement => {
  const iconSize = stateNode.parentId ? "18px" : "24px";
  const type = stateNode.definition.Type;

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
      if (
        stateNode.definition.Resource &&
        typeof stateNode.definition.Resource === "string" &&
        stateNode.definition.Resource.includes("states:startExecution.")
      ) {
        return (
          <IconJumpRope
            color={theme.nodeBorderColors.stepFunction}
            size={iconSize}
          />
        );
      }
      return <IconLambda color={theme.nodeBorderColors.task} size={iconSize} />;
    case "Choice":
      return (
        <IconProgressHelp
          color={theme.nodeBorderColors.choice}
          size={iconSize}
        />
      );
    case "Wait":
      return (
        <IconStopwatch color={theme.nodeBorderColors.wait} size={iconSize} />
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
      return <IconSitemap color={theme.nodeBorderColors.map} size={iconSize} />;
    default:
      return <IconLambda color={theme.infoColor} size={iconSize} />;
  }
};

export const getBorderColor = (
  stateNode: StateNode,
  theme: ViewerTheme,
): string => {
  if (stateNode.id === "__start__") return theme.successColor;
  if (stateNode.id === "__end__") return theme.errorColor;

  if (
    stateNode.type === "Task" &&
    stateNode.definition.Resource &&
    typeof stateNode.definition.Resource === "string" &&
    stateNode.definition.Resource.includes("states:startExecution.")
  ) {
    return theme.nodeBorderColors.stepFunction;
  }

  return (
    theme.nodeBorderColors[
      stateNode.type.toLowerCase() as keyof typeof theme.nodeBorderColors
    ] || theme.borderColor
  );
};
