import { Position } from "reactflow";
import { Connection, StateNode, ViewerTheme } from "../types";

export type Point = { x: number; y: number };

/**
 * `data` passed to the custom React Flow node components.
 */
export interface StateNodeData {
  stateNode: StateNode;
  /** @deprecated Colors come from CSS variables; kept for compatibility. */
  theme?: ViewerTheme;
  onStateClick?: (state: StateNode) => void;
  onToggleExpand?: (nodeId: string) => void;
  isHighlighted?: boolean;
  isActiveMatch?: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
  /** Ids of nested states (inside groups) that match the current search. */
  highlightedIds?: ReadonlySet<string>;
  /** Id of the selected state, used by groups to mark a selected child. */
  selectedId?: string | null;
}

export interface StateNodeComponentProps {
  data: StateNodeData;
  selected?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
}

/**
 * `data` passed to the custom edge component.
 */
export interface AslEdgeData {
  connection: Connection;
  points?: Point[];
  labelText?: string;
  labelTitle?: string;
  /** Index among edges sharing the same source and target (stacks labels). */
  labelOffset?: number;
  isActive?: boolean;
  isDimmed?: boolean;
}

export function areNodePropsEqual(
  prev: StateNodeComponentProps,
  next: StateNodeComponentProps,
): boolean {
  return (
    prev.data === next.data &&
    prev.selected === next.selected &&
    prev.sourcePosition === next.sourcePosition &&
    prev.targetPosition === next.targetPosition
  );
}

export function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
