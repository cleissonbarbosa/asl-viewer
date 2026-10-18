import { ASLDefinition, StateNode, Connection, GraphLayout } from "../../types";
import { END_NODE_ID, START_NODE_ID, getItemProcessor } from "../asl-utils";
import {
  createStateNode,
  createGroupNode,
  createArtificialNodes,
} from "./node-factory";
import { createConnections } from "./connections";
import { calculateHierarchicalLayout } from "./hierarchical-layout";
import { createParallelChildNodes, createMapChildNodes } from "./group-nodes";
import { calculateImprovedSpacing } from "./spacing";

export interface GraphLayoutOptions {
  /** Ids of Parallel / Map states that should be laid out expanded. */
  expandedGroups?: Iterable<string>;
}

/**
 * Creates the node for a state: a group node for Parallel / Map states,
 * a regular node otherwise.
 */
function createNode(
  stateName: string,
  definition: ASLDefinition,
  expandedGroups: ReadonlySet<string>,
): StateNode {
  const state = definition.States[stateName];
  const expanded = expandedGroups.has(stateName);

  if (state.Type === "Parallel" && Array.isArray(state.Branches)) {
    const children = createParallelChildNodes(stateName, state.Branches);
    return createGroupNode(
      stateName,
      state,
      definition.StartAt,
      children,
      expanded,
    );
  }

  const processor = state.Type === "Map" ? getItemProcessor(state) : undefined;
  if (processor) {
    const children = createMapChildNodes(stateName, processor);
    return createGroupNode(
      stateName,
      state,
      definition.StartAt,
      children,
      expanded,
    );
  }

  return createStateNode(stateName, state, definition.StartAt);
}

function isValidState(definition: ASLDefinition, stateName: string): boolean {
  const state = definition.States[stateName];
  return !!state && typeof state === "object";
}

/**
 * Converts ASL definition to graph layout using a layered approach optimized
 * for React Flow. Edges include bend points for orthogonal routing.
 */
export function createGraphLayout(
  definition: ASLDefinition,
  direction: "TB" | "LR" = "TB",
  options: GraphLayoutOptions = {},
): GraphLayout {
  const expandedGroups = new Set(options.expandedGroups ?? []);
  const states = definition.States ?? {};
  const stateNames = Object.keys(states).filter((name) =>
    isValidState(definition, name),
  );

  const nodes: StateNode[] = [];
  const edges: Connection[] = [];

  // Create artificial start and end nodes
  const { start: startNode, end: endNode } = createArtificialNodes();
  nodes.push(startNode, endNode);

  // Create connection from artificial start to actual start state
  edges.push({
    from: START_NODE_ID,
    to: definition.StartAt,
    type: "next",
  });

  // Create nodes for all states
  for (const stateName of stateNames) {
    nodes.push(createNode(stateName, definition, expandedGroups));
  }

  // Create edges between states
  for (const stateName of stateNames) {
    edges.push(...createConnections(stateName, states[stateName]));
  }

  // Add connections from end states to artificial end node
  for (const endState of findEndStates(definition)) {
    edges.push({
      from: endState,
      to: END_NODE_ID,
      type: "next",
    });
  }

  const layout = calculateHierarchicalLayout(
    nodes,
    edges,
    START_NODE_ID,
    direction,
  );

  return {
    nodes: layout.nodes,
    edges: layout.edges,
    width: layout.width,
    height: layout.height,
  };
}

/**
 * Creates a simplified layout for basic use cases without complex dependencies
 */
export function createSimpleLayout(definition: ASLDefinition): GraphLayout {
  const states = definition.States ?? {};
  const stateEntries = Object.keys(states)
    .filter((name) => isValidState(definition, name))
    .map((name) => [name, states[name]] as const);
  const nodes: StateNode[] = [];
  const edges: Connection[] = [];
  const noExpandedGroups = new Set<string>();

  // Calculate spacing first
  const tempNodes = stateEntries.map(([stateName, state]) =>
    createStateNode(stateName, state, definition.StartAt),
  );
  const tempEdges = stateEntries.flatMap(([stateName, state]) =>
    createConnections(stateName, state),
  );
  const spacingConfig = calculateImprovedSpacing(tempNodes, tempEdges);

  let currentY = 50;
  const baseSpacing = spacingConfig.levelSpacing;
  const labeledEdgeSpacing = 50; // Extra spacing for labeled edges
  const centerX = 200;

  // Create artificial start node
  const { start: startNode, end: endNode } = createArtificialNodes();
  startNode.position = { x: centerX - startNode.size.width / 2, y: currentY };
  nodes.push(startNode);

  // Create connection from artificial start to actual start state
  edges.push({
    from: START_NODE_ID,
    to: definition.StartAt,
    type: "next",
  });

  // Create edges between states
  edges.push(...tempEdges);

  // Add connections from end states to artificial end node
  for (const endState of findEndStates(definition)) {
    edges.push({
      from: endState,
      to: END_NODE_ID,
      type: "next",
    });
  }

  const labeledSources = new Set(
    edges.filter((edge) => edge.label?.trim()).map((edge) => edge.from),
  );

  currentY += startNode.size.height + baseSpacing;

  // Create nodes in simple vertical layout with dynamic spacing
  for (const [stateName] of stateEntries) {
    const node = createNode(stateName, definition, noExpandedGroups);
    node.position = { x: centerX - node.size.width / 2, y: currentY };
    nodes.push(node);

    let spacingToNext = baseSpacing;
    if (labeledSources.has(stateName)) spacingToNext += labeledEdgeSpacing;
    if (node.isGroup) spacingToNext += 20; // Extra space for group nodes

    currentY += node.size.height + spacingToNext;
  }

  // Create artificial end node
  endNode.position = { x: centerX - endNode.size.width / 2, y: currentY };
  nodes.push(endNode);

  return {
    nodes,
    edges,
    width: 400,
    height: currentY + endNode.size.height + 50,
  };
}

/**
 * Finds all end states in the ASL definition
 */
function findEndStates(definition: ASLDefinition): string[] {
  const endStates: string[] = [];
  Object.entries(definition.States ?? {}).forEach(([stateName, state]) => {
    if (
      state &&
      (state.End === true || state.Type === "Succeed" || state.Type === "Fail")
    ) {
      endStates.push(stateName);
    }
  });
  return endStates;
}
