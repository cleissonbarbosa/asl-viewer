import { StateDefinition, StateNode } from "../../types";
import { getStateSize, calculateGroupBounds } from "./sizing";

/**
 * Creates a regular state node
 */
export function createStateNode(
  stateName: string,
  state: StateDefinition,
  startAt: string,
): StateNode {
  const isStartState = stateName === startAt;
  const isEndState =
    state.End === true || state.Type === "Succeed" || state.Type === "Fail";
  const size = getStateSize(state.Type, isStartState, isEndState);

  return {
    id: stateName,
    name: stateName,
    type: state.Type,
    definition: state,
    position: { x: 0, y: 0 }, // Will be set by layout algorithm
    size,
    connections: [],
    isStartState,
    isEndState,
  };
}

/**
 * Creates a group node that contains parent and child nodes
 */
export function createGroupNode(
  stateName: string,
  state: StateDefinition,
  startAt: string,
  children: StateNode[],
): StateNode {
  const isStartState = stateName === startAt;
  const isEndState =
    state.End === true || state.Type === "Succeed" || state.Type === "Fail";

  // Calculate group bounds based on children (for expanded state)
  const groupBounds = calculateGroupBounds(state.Type, children);

  // Start with collapsed size (same as regular node)
  const collapsedSize = getStateSize(state.Type, isStartState, isEndState);

  return {
    id: stateName,
    name: stateName,
    type: state.Type,
    definition: state,
    position: { x: 0, y: 0 }, // Will be set by layout algorithm
    size: collapsedSize, // Start collapsed
    connections: [],
    isStartState,
    isEndState,
    isGroup: true,
    groupBounds,
    children,
    isExpanded: false, // Start collapsed
  };
}

/**
 * Creates artificial start and end nodes for the graph
 */
export function createArtificialNodes(): { start: StateNode; end: StateNode } {
  const startNode: StateNode = {
    id: "__start__",
    name: "START",
    type: "Pass", // Using Pass as a placeholder type
    definition: { Type: "Pass" },
    position: { x: 0, y: 0 },
    size: { width: 80, height: 80 }, // Circular node
    connections: [],
    isStartState: false,
    isEndState: false,
  };

  const endNode: StateNode = {
    id: "__end__",
    name: "END",
    type: "Pass", // Using Pass as a placeholder type
    definition: { Type: "Pass" },
    position: { x: 0, y: 0 },
    size: { width: 80, height: 80 }, // Circular node
    connections: [],
    isStartState: false,
    isEndState: false,
  };

  return { start: startNode, end: endNode };
}
