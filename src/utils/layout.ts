import {
  ASLDefinition,
  StateDefinition,
  StateNode,
  Connection,
  GraphLayout,
} from "../types";

/**
 * Converts ASL definition to graph layout using a hierarchical approach optimized for React Flow
 */
export function createGraphLayout(definition: ASLDefinition): GraphLayout {
  const nodes: StateNode[] = [];
  const edges: Connection[] = [];

  // Create artificial start node
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
  nodes.push(startNode);

  // Create artificial end node
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
  nodes.push(endNode);

  // Create connection from artificial start to actual start state
  edges.push({
    from: "__start__",
    to: definition.StartAt,
    type: "next",
  });

  // Find end states and create connections to artificial end node
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

  // Create nodes for all states
  Object.entries(definition.States).forEach(([stateName, state], index) => {
    const node = createStateNode(stateName, state, definition.StartAt);
    // Remove the isStartState and isEndState flags since we have artificial nodes now
    // node.isStartState = false;
    // node.isEndState = false;
    nodes.push(node);
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

function calculateHierarchicalLayout(
  nodes: StateNode[],
  edges: Connection[],
  startAt: string
): { nodes: StateNode[]; width: number; height: number } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const levels: string[][] = [];

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from)!.push(edge.to);
  });

  // Check if there are edges with labels between levels
  const hasLabeledEdgesBetweenLevels = (
    fromLevel: number,
    toLevel: number
  ): boolean => {
    if (fromLevel >= levels.length || toLevel >= levels.length) return false;

    for (const fromNode of levels[fromLevel]) {
      for (const toNode of levels[toLevel]) {
        const edge = edges.find((e) => e.from === fromNode && e.to === toNode);
        if (edge && edge.label && edge.label.trim().length > 0) {
          return true;
        }
      }
    }
    return false;
  };

  // BFS to determine levels
  const queue = [{ id: startAt, level: 0 }];
  visited.add(startAt);

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;

    if (!levels[level]) {
      levels[level] = [];
    }
    levels[level].push(id);

    const neighbors = adjacency.get(id) || [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, level: level + 1 });
      }
    });
  }

  // Add any remaining nodes (unreachable) to the last level
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      if (levels.length === 0) {
        levels.push([]);
      }
      levels[levels.length - 1].push(node.id);
    }
  });

  // Position nodes with dynamic spacing based on labeled edges
  const nodeSpacing = 340;
  const baseLevelSpacing = 150;
  const labeledEdgeSpacing = 50; // Extra spacing for labeled edges
  const startX = 100;
  const startY = 100;

  let maxWidth = 0;
  let currentY = startY;

  levels.forEach((level, levelIndex) => {
    const levelWidth = level.length * nodeSpacing;
    maxWidth = Math.max(maxWidth, levelWidth);

    const startXForLevel = startX + (maxWidth - levelWidth) / 2;

    level.forEach((nodeId, nodeIndex) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.position = {
          x: startXForLevel + nodeIndex * nodeSpacing,
          y: currentY,
        };
      }
    });

    // Calculate spacing for next level
    if (levelIndex < levels.length - 1) {
      let spacingToNext = baseLevelSpacing;

      // Check if there are labeled edges between this level and the next
      if (hasLabeledEdgesBetweenLevels(levelIndex, levelIndex + 1)) {
        spacingToNext += labeledEdgeSpacing;
      }

      currentY += spacingToNext;
    }
  });

  const totalWidth = maxWidth + 200;
  const totalHeight = currentY + 100;

  return {
    nodes: Array.from(nodeMap.values()),
    width: Math.max(totalWidth, 600),
    height: Math.max(totalHeight, 400),
  };
}

function createStateNode(
  stateName: string,
  state: StateDefinition,
  startAt: string
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

function getStateSize(
  type: string,
  isStartState = false,
  isEndState = false
): { width: number; height: number } {
  // All regular state nodes are now rectangular (no more circular end states)
  switch (type) {
    case "Choice":
      return { width: 240, height: 40 };
    case "Parallel":
    case "Map":
      return { width: 260, height: 40 };
    case "Task":
      return { width: 230, height: 40 };
    case "Wait":
      return { width: 220, height: 40 };
    default:
      return { width: 220, height: 40 };
  }
}

function createConnections(
  stateName: string,
  state: StateDefinition
): Connection[] {
  const connections: Connection[] = [];

  // Next connection
  if (state.Next) {
    connections.push({
      from: stateName,
      to: state.Next,
      type: "next",
    });
  }

  // Choice connections
  if (state.Choices) {
    state.Choices.forEach((choice, index) => {
      connections.push({
        from: stateName,
        to: choice.Next,
        type: "choice",
        label: `Choice ${index + 1}`,
        condition: formatChoiceCondition(choice),
      });
    });
  }

  // Default connection for Choice states
  if (state.Default) {
    connections.push({
      from: stateName,
      to: state.Default,
      type: "default",
      label: "Default",
    });
  }

  // Catch connections
  if (state.Catch) {
    state.Catch.forEach((catchDef, index) => {
      connections.push({
        from: stateName,
        to: catchDef.Next,
        type: "error",
        label: `Catch ${index + 1}`,
        condition: catchDef.ErrorEquals.join(", "),
      });
    });
  }

  return connections;
}

function formatChoiceCondition(choice: any): string {
  // Create a human-readable condition string
  if (choice.Variable) {
    const variable = choice.Variable;

    if (choice.StringEquals !== undefined)
      return `${variable} == "${choice.StringEquals}"`;
    if (choice.StringLessThan !== undefined)
      return `${variable} < "${choice.StringLessThan}"`;
    if (choice.StringGreaterThan !== undefined)
      return `${variable} > "${choice.StringGreaterThan}"`;
    if (choice.NumericEquals !== undefined)
      return `${variable} == ${choice.NumericEquals}`;
    if (choice.NumericLessThan !== undefined)
      return `${variable} < ${choice.NumericLessThan}`;
    if (choice.NumericGreaterThan !== undefined)
      return `${variable} > ${choice.NumericGreaterThan}`;
    if (choice.BooleanEquals !== undefined)
      return `${variable} == ${choice.BooleanEquals}`;
  }

  return "condition";
}

/**
 * Creates a simplified layout for basic use cases without complex dependencies
 */
export function createSimpleLayout(definition: ASLDefinition): GraphLayout {
  const nodes: StateNode[] = [];
  const edges: Connection[] = [];

  let currentY = 50;
  const baseSpacing = 150;
  const labeledEdgeSpacing = 50; // Extra spacing for labeled edges
  const centerX = 200;

  // Create artificial start node
  const startNode: StateNode = {
    id: "__start__",
    name: "START",
    type: "Pass",
    definition: { Type: "Pass" },
    position: { x: centerX - 40, y: currentY },
    size: { width: 40, height: 40 },
    connections: [],
    isStartState: false,
    isEndState: false,
  };
  nodes.push(startNode);

  // Create connection from artificial start to actual start state
  edges.push({
    from: "__start__",
    to: definition.StartAt,
    type: "next",
  });

  // Find end states
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
        edge.from === nodeId && edge.label && edge.label.trim().length > 0
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
    const node = createStateNode(stateName, state, definition.StartAt);
    node.position = { x: centerX - node.size.width / 2, y: currentY };
    nodes.push(node);

    // Calculate spacing for next node
    if (index < stateEntries.length - 1) {
      let spacingToNext = baseSpacing;
      if (hasLabeledEdgesFrom(stateName)) {
        spacingToNext += labeledEdgeSpacing;
      }
      currentY += spacingToNext;
    } else {
      // For the last state, check if it has labeled edges to end
      let spacingToEnd = baseSpacing;
      if (hasLabeledEdgesFrom(stateName)) {
        spacingToEnd += labeledEdgeSpacing;
      }
      currentY += spacingToEnd;
    }
  });

  // Create artificial end node
  const endNode: StateNode = {
    id: "__end__",
    name: "END",
    type: "Pass",
    definition: { Type: "Pass" },
    position: { x: centerX - 40, y: currentY },
    size: { width: 40, height: 40 },
    connections: [],
    isStartState: false,
    isEndState: false,
  };
  nodes.push(endNode);

  return {
    nodes,
    edges,
    width: 400,
    height: currentY + 100,
  };
}
