import React from "react";
import {
  EdgeLabelRenderer,
  EdgeProps,
  Position,
  getSmoothStepPath,
} from "reactflow";
import { AslEdgeData, Point, classNames } from "./flow-types";

const ARROW_LENGTH = 7;
const ARROW_HALF_WIDTH = 4.5;
const CORNER_RADIUS = 10;
const LABEL_STACK_OFFSET = 22;

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function towards(from: Point, to: Point, length: number): Point {
  const total = distance(from, to) || 1;
  return {
    x: from.x + ((to.x - from.x) / total) * length,
    y: from.y + ((to.y - from.y) / total) * length,
  };
}

/**
 * Builds an SVG path through `points` with rounded corners.
 */
export function roundedPath(points: Point[], radius = CORNER_RADIUS): string {
  if (points.length === 0) return "";
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const previous = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];
    const r = Math.min(
      radius,
      distance(previous, corner) / 2,
      distance(corner, next) / 2,
    );
    const cross =
      (corner.x - previous.x) * (next.y - corner.y) -
      (corner.y - previous.y) * (next.x - corner.x);
    if (r < 0.5 || Math.abs(cross) < 0.01) {
      path += ` L ${corner.x},${corner.y}`;
      continue;
    }
    const start = towards(corner, previous, r);
    const end = towards(corner, next, r);
    path += ` L ${start.x},${start.y} Q ${corner.x},${corner.y} ${end.x},${end.y}`;
  }
  const last = points[points.length - 1];
  return `${path} L ${last.x},${last.y}`;
}

const DIRECTIONS: Record<Position, Point> = {
  [Position.Top]: { x: 0, y: 1 },
  [Position.Bottom]: { x: 0, y: -1 },
  [Position.Left]: { x: 1, y: 0 },
  [Position.Right]: { x: -1, y: 0 },
};

function arrowPath(tip: Point, direction: Point): string {
  const baseX = tip.x - direction.x * ARROW_LENGTH;
  const baseY = tip.y - direction.y * ARROW_LENGTH;
  const normalX = -direction.y * ARROW_HALF_WIDTH;
  const normalY = direction.x * ARROW_HALF_WIDTH;
  return `M ${tip.x},${tip.y} L ${baseX + normalX},${baseY + normalY} L ${baseX - normalX},${baseY - normalY} Z`;
}

/**
 * Orthogonal edge that follows the bend points computed by the layout
 * engine, falling back to a smooth-step path when none are available
 * (for example after a node was dragged).
 */
export const AslEdge: React.FC<EdgeProps<AslEdgeData>> = React.memo(
  function AslEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  }) {
    const direction = DIRECTIONS[targetPosition] ?? DIRECTIONS[Position.Top];
    // Stop the stroke at the arrow base so it does not poke through the tip
    const tip = { x: targetX, y: targetY };
    const end = {
      x: targetX - direction.x * ARROW_LENGTH,
      y: targetY - direction.y * ARROW_LENGTH,
    };

    let path: string;
    let label: Point;
    const points = data?.points;
    if (points && points.length > 0) {
      const route = [{ x: sourceX, y: sourceY }, ...points, end];
      path = roundedPath(route);
      label = points[1] ?? points[0];
    } else {
      const [smoothPath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX: end.x,
        targetY: end.y,
        targetPosition,
        borderRadius: CORNER_RADIUS,
      });
      path = smoothPath;
      label = { x: labelX, y: labelY };
    }

    const type = data?.connection.type ?? "next";
    const offset = (data?.labelOffset ?? 0) * LABEL_STACK_OFFSET;

    return (
      <>
        <g
          className={classNames(
            "asl-edge",
            `asl-edge--${type}`,
            data?.isActive && "is-active",
            data?.isDimmed && "is-dimmed",
          )}
        >
          <path className="asl-edge__path" d={path} />
          <path className="asl-edge__arrow" d={arrowPath(tip, direction)} />
          <path
            className="react-flow__edge-interaction"
            d={path}
            fill="none"
            strokeOpacity={0}
            strokeWidth={16}
          />
        </g>
        {data?.labelText && (
          <EdgeLabelRenderer>
            <div
              className={classNames(
                "asl-edge-label",
                `asl-edge-label--${type}`,
                data.isActive && "is-active",
                data.isDimmed && "is-dimmed",
                "nodrag nopan",
              )}
              style={{
                transform: `translate(-50%, -50%) translate(${label.x}px, ${label.y + offset}px)`,
              }}
              title={data.labelTitle}
            >
              {data.labelText}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  },
);

AslEdge.displayName = "AslEdge";
