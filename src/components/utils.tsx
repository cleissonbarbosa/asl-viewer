import React from "react";
import {
  IconArrowsSplit2,
  IconBell,
  IconBolt,
  IconBrain,
  IconBucket,
  IconChartDots,
  IconCode,
  IconDatabase,
  IconJumpRope,
  IconLambda,
  IconListDetails,
  IconMail,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
  IconPlugConnected,
  IconRosetteDiscountCheckFilled,
  IconServer,
  IconSettings,
  IconShield,
  IconSitemap,
  IconStack2,
  IconStopwatch,
  IconTimeline,
  IconUserCheck,
  IconVectorBezier,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import { StateNode } from "../types";
import {
  END_NODE_ID,
  START_NODE_ID,
  describeResource,
  isNestedExecution,
} from "../core/asl-utils";

type IconComponent = typeof IconLambda;

const SERVICE_ICONS: Record<string, IconComponent> = {
  lambda: IconLambda,
  dynamodb: IconDatabase,
  rds: IconDatabase,
  redshift: IconDatabase,
  "redshift-data": IconDatabase,
  s3: IconBucket,
  sns: IconBell,
  ses: IconMail,
  sesv2: IconMail,
  sqs: IconStack2,
  events: IconBolt,
  http: IconWorld,
  apigateway: IconWorld,
  ecs: IconServer,
  eks: IconServer,
  batch: IconServer,
  ec2: IconServer,
  glue: IconChartDots,
  athena: IconChartDots,
  databrew: IconChartDots,
  elasticmapreduce: IconChartDots,
  "emr-serverless": IconChartDots,
  "emr-containers": IconChartDots,
  sagemaker: IconBrain,
  bedrock: IconBrain,
  comprehend: IconBrain,
  rekognition: IconBrain,
  textract: IconBrain,
  translate: IconBrain,
  transcribe: IconBrain,
  codebuild: IconCode,
  secretsmanager: IconShield,
  kms: IconShield,
  iam: IconShield,
  kinesis: IconTimeline,
  firehose: IconTimeline,
  ssm: IconSettings,
  activity: IconUserCheck,
};

/**
 * Picks the icon component that represents a state.
 */
export function getStateIconComponent(
  stateNode: Pick<StateNode, "id" | "type" | "definition">,
): IconComponent {
  if (stateNode.id === START_NODE_ID) return IconPlayerPlayFilled;
  if (stateNode.id === END_NODE_ID) return IconPlayerStopFilled;

  switch (stateNode.definition?.Type ?? stateNode.type) {
    case "Pass":
      return IconListDetails;
    case "Task": {
      if (isNestedExecution(stateNode.definition)) return IconJumpRope;
      const resource = describeResource(stateNode.definition.Resource);
      if (!resource) return IconLambda;
      return (
        SERVICE_ICONS[resource.serviceKey] ??
        (resource.sdk ? IconPlugConnected : IconLambda)
      );
    }
    case "Choice":
      return IconArrowsSplit2;
    case "Wait":
      return IconStopwatch;
    case "Succeed":
      return IconRosetteDiscountCheckFilled;
    case "Fail":
      return IconX;
    case "Parallel":
      return IconVectorBezier;
    case "Map":
      return IconSitemap;
    default:
      return IconLambda;
  }
}

/**
 * Renders the icon of a state. Colors come from CSS (`currentColor`), so the
 * icon follows the active theme without re-rendering.
 */
export const StateIcon: React.FC<{
  stateNode: Pick<StateNode, "id" | "type" | "definition">;
  size?: number;
}> = React.memo(({ stateNode, size = 18 }) => {
  const Icon = getStateIconComponent(stateNode);
  return <Icon size={size} stroke={1.8} aria-hidden />;
});

StateIcon.displayName = "StateIcon";
