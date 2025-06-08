import { ASLDefinition, StateNode, Connection, GraphLayout } from "../../types";
import {
  createStateNode,
  createGroupNode,
  createArtificialNodes,
} from "./node-factory";
import { createConnections } from "./connections";
import { calculateHierarchicalLayout } from "./hierarchical-layout";
import { createParallelChildNodes, createMapChildNodes } from "./group-nodes";
import { calculateImprovedSpacing } from "./reactive-layout";

/**
 * Converts ASL definition to graph layout using a hierarchical approach optimized for React Flow
 */
export function createGraphLayout(definition: ASLDefinition): GraphLayout {
  const nodes: StateNode[] = [];
  const edges: Connection[] = [];

  // Create artificial start and end nodes
  const { start: startNode, end: endNode } = createArtificialNodes();
  nodes.push(startNode, endNode);

  // Create connection from artificial start to actual start state
  edges.push({
    from: "__start__",
    to: definition.StartAt,
    type: "next",
  });

  // Find end states and create connections to artificial end node
  const endStates = findEndStates(definition);

  // Create nodes for all states
  Object.entries(definition.States).forEach(([stateName, state]) => {
    if (state.Type === "Parallel" && state.Branches) {
      // Create a group node for Parallel state
      const childNodes = createParallelChildNodes(stateName, state.Branches);
      const groupNode = createGroupNode(
        stateName,
        state,
        definition.StartAt,
        childNodes,
      );
      nodes.push(groupNode);
    } else if (state.Type === "Map" && state.Iterator) {
      // Create a group node for Map state
      const childNodes = createMapChildNodes(stateName, state.Iterator);
      const groupNode = createGroupNode(
        stateName,
        state,
        definition.StartAt,
        childNodes,
      );
      nodes.push(groupNode);
    } else {
      // Regular state node
      const node = createStateNode(stateName, state, definition.StartAt);
      nodes.push(node);
    }
  });

  // Create edges between states
  Object.entries(definition.States).forEach(([stateName, state]) => {
    const connections = createConnections(stateName, state);
    edges.push(...connections);
  });

  // Add connections from end states to artificial end node
  endStates.forEach((endState) => {
    edges.push({
      from: endState,
      to: "__end__",
      type: "next",
    });
  });

  // Calculate hierarchical layout
  const layout = calculateHierarchicalLayout(nodes, edges, "__start__");

  return {
    nodes: layout.nodes,
    edges,
    width: layout.width,
    height: layout.height,
  };
}

/**
 * Creates a simplified layout for basic use cases without complex dependencies
 */
export function createSimpleLayout(definition: ASLDefinition): GraphLayout {
  const nodes: StateNode[] = [];
  const edges: Connection[] = [];

  // Calculate improved spacing first
  const tempNodes = Object.entries(definition.States).map(
    ([stateName, state]) =>
      createStateNode(stateName, state, definition.StartAt),
  );

  // Create temporary edges to analyze spacing needs
  const tempEdges: Connection[] = [];
  Object.entries(definition.States).forEach(([stateName, state]) => {
    const connections = createConnections(stateName, state);
    tempEdges.push(...connections);
  });

  const spacingConfig = calculateImprovedSpacing(tempNodes, tempEdges);

  let currentY = 50;
  const baseSpacing = spacingConfig.levelSpacing;
  const labeledEdgeSpacing = 50; // Extra spacing for labeled edges
  const centerX = 200;

  // Create artificial start node
  const { start: startNode, end: endNode } = createArtificialNodes();
  startNode.position = { x: centerX - 40, y: currentY };
  startNode.size = { width: 40, height: 40 };
  nodes.push(startNode);

  // Create connection from artificial start to actual start state
  edges.push({
    from: "__start__",
    to: definition.StartAt,
    type: "next",
  });

  // Find end states
  const endStates = findEndStates(definition);

  // Create edges between states first to check for labels
  Object.entries(definition.States).forEach(([stateName, state]) => {
    const connections = createConnections(stateName, state);
    edges.push(...connections);
  });

  // Add connections from end states to artificial end node
  endStates.forEach((endState) => {
    edges.push({
      from: endState,
      to: "__end__",
      type: "next",
    });
  });

  // Helper function to check if there are labeled edges from a specific node
  const hasLabeledEdgesFrom = (nodeId: string): boolean => {
    return edges.some(
      (edge) =>
        edge.from === nodeId && edge.label && edge.label.trim().length > 0,
    );
  };

  // Position start node
  currentY += baseSpacing;
  if (hasLabeledEdgesFrom("__start__")) {
    currentY += labeledEdgeSpacing;
  }

  // Create nodes in simple vertical layout with dynamic spacing
  const stateEntries = Object.entries(definition.States);
  stateEntries.forEach(([stateName, state], index) => {
    if (state.Type === "Parallel" && state.Branches) {
      // Create a group node for Parallel state
      const childNodes = createParallelChildNodes(stateName, state.Branches);
      const groupNode = createGroupNode(
        stateName,
        state,
        definition.StartAt,
        childNodes,
      );
      groupNode.position = {
        x: centerX - groupNode.size.width / 2,
        y: currentY,
      };
      nodes.push(groupNode);
    } else if (state.Type === "Map" && state.Iterator) {
      // Create a group node for Map state
      const childNodes = createMapChildNodes(stateName, state.Iterator);
      const groupNode = createGroupNode(
        stateName,
        state,
        definition.StartAt,
        childNodes,
      );
      groupNode.position = {
        x: centerX - groupNode.size.width / 2,
        y: currentY,
      };
      nodes.push(groupNode);
    } else {
      // Regular state node
      const node = createStateNode(stateName, state, definition.StartAt);
      node.position = { x: centerX - node.size.width / 2, y: currentY };
      nodes.push(node);
    }

    // Calculate spacing for next node
    if (index < stateEntries.length - 1) {
      let spacingToNext = baseSpacing;
      if (hasLabeledEdgesFrom(stateName)) {
        spacingToNext += labeledEdgeSpacing;
      }

      // Add extra space for group nodes
      if (
        (state.Type === "Parallel" && state.Branches) ||
        (state.Type === "Map" && state.Iterator)
      ) {
        spacingToNext += 50;
      }

      currentY += spacingToNext;
    } else {
      // For the last state, check if it has labeled edges to end
      let spacingToEnd = baseSpacing;
      if (hasLabeledEdgesFrom(stateName)) {
        spacingToEnd += labeledEdgeSpacing;
      }

      // Add extra space for group nodes
      if (
        (state.Type === "Parallel" && state.Branches) ||
        (state.Type === "Map" && state.Iterator)
      ) {
        spacingToEnd += 50;
      }

      currentY += spacingToEnd;
    }
  });

  // Create artificial end node
  endNode.position = { x: centerX - 40, y: currentY };
  endNode.size = { width: 40, height: 40 };
  nodes.push(endNode);

  return {
    nodes,
    edges,
    width: 400,
    height: currentY + 100,
  };
}

/**
 * Finds all end states in the ASL definition
 */
function findEndStates(definition: ASLDefinition): string[] {
  const endStates: string[] = [];
  Object.entries(definition.States).forEach(([stateName, state]) => {
    if (
      state.End === true ||
      state.Type === "Succeed" ||
      state.Type === "Fail"
    ) {
      endStates.push(stateName);
    }
  });
  return endStates;
}
