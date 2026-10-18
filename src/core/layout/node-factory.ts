import { StateDefinition, StateNode } from "../../types";
import { END_NODE_ID, START_NODE_ID } from "../asl-utils";
import {
  getStateSize,
  calculateGroupBounds,
  TERMINAL_NODE_SIZE,
} from "./sizing";

function isTerminal(state: StateDefinition): boolean {
  return (
    state.End === true || state.Type === "Succeed" || state.Type === "Fail"
  );
}

/**
 * Creates a regular state node
 */
export function createStateNode(
  stateName: string,
  state: StateDefinition,
  startAt: string,
): StateNode {
  return {
    id: stateName,
    name: stateName,
    type: state.Type,
    definition: state,
    position: { x: 0, y: 0 }, // Will be set by layout algorithm
    size: getStateSize(state.Type),
    connections: [],
    isStartState: stateName === startAt,
    isEndState: isTerminal(state),
  };
}

/**
 * Creates a group node (Parallel / Map) that renders its children inline
 * when expanded.
 */
export function createGroupNode(
  stateName: string,
  state: StateDefinition,
  startAt: string,
  children: StateNode[],
  isExpanded = false,
): StateNode {
  // Size of the container when expanded
  const groupBounds = calculateGroupBounds(state.Type, children);

  return {
    id: stateName,
    name: stateName,
    type: state.Type,
    definition: state,
    position: { x: 0, y: 0 }, // Will be set by layout algorithm
    size: isExpanded ? { ...groupBounds } : getStateSize(state.Type),
    connections: [],
    isStartState: stateName === startAt,
    isEndState: isTerminal(state),
    isGroup: true,
    groupBounds,
    children,
    isExpanded,
  };
}

/**
 * Creates artificial start and end nodes for the graph
 */
export function createArtificialNodes(): { start: StateNode; end: StateNode } {
  const startNode: StateNode = {
    id: START_NODE_ID,
    name: "START",
    type: "Pass", // Using Pass as a placeholder type
    definition: { Type: "Pass" },
    position: { x: 0, y: 0 },
    size: { ...TERMINAL_NODE_SIZE },
    connections: [],
    isStartState: false,
    isEndState: false,
  };

  const endNode: StateNode = {
    id: END_NODE_ID,
    name: "END",
    type: "Pass", // Using Pass as a placeholder type
    definition: { Type: "Pass" },
    position: { x: 0, y: 0 },
    size: { ...TERMINAL_NODE_SIZE },
    connections: [],
    isStartState: false,
    isEndState: false,
  };

  return { start: startNode, end: endNode };
}
