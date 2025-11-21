import { StateNode, Connection } from "../../types";
import { calculateImprovedSpacing } from "./reactive-layout";

/**
 * Calculates hierarchical layout for nodes using BFS algorithm
 */
export function calculateHierarchicalLayout(
  nodes: StateNode[],
  edges: Connection[],
  startAt: string,
  direction: "TB" | "LR" = "TB",
): { nodes: StateNode[]; width: number; height: number } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const levels: string[][] = [];

  // Separate parent nodes from child nodes
  const parentNodes = nodes.filter((node) => !node.parentId);
  const childNodes = nodes.filter((node) => node.parentId);

  // Build adjacency list (only for parent nodes initially)
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    // Only process edges between parent nodes for the main layout
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);

    if (fromNode && toNode && !fromNode.parentId && !toNode.parentId) {
      if (!adjacency.has(edge.from)) {
        adjacency.set(edge.from, []);
      }
      adjacency.get(edge.from)!.push(edge.to);
    }
  });

  // Check if there are edges with labels between levels
  const hasLabeledEdgesBetweenLevels = (
    fromLevel: number,
    toLevel: number,
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

  // BFS to determine levels (only for parent nodes)
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

  // Add any remaining parent nodes (unreachable) to the last level
  parentNodes.forEach((node) => {
    if (!visited.has(node.id)) {
      if (levels.length === 0) {
        levels.push([]);
      }
      levels[levels.length - 1].push(node.id);
    }
  });

  // Calculate improved spacing based on graph complexity
  const spacingConfig = calculateImprovedSpacing(parentNodes, edges);

  // Position nodes with dynamic spacing based on labeled edges
  const layout = positionNodesInLevels(
    levels,
    nodeMap,
    edges,
    direction,
    spacingConfig,
  );

  return {
    nodes: Array.from(nodeMap.values()),
    width: Math.max(layout.width, 600),
    height: Math.max(layout.height, 400),
  };
}

/**
 * Positions nodes in their calculated levels with proper spacing
 */
function positionNodesInLevels(
  levels: string[][],
  nodeMap: Map<string, StateNode>,
  edges: Connection[],
  direction: "TB" | "LR",
  spacingConfig?: { nodeSpacing: number; levelSpacing: number },
): { width: number; height: number } {
  // Use provided spacing or fall back to defaults
  const gapBetweenNodes = spacingConfig?.nodeSpacing || 60;
  const gapBetweenLevels = spacingConfig?.levelSpacing || 60;
  const labeledEdgeSpacing = 40; // Extra spacing for labeled edges
  const startX = 50;
  const startY = 50;

  // Build incoming edges map for fast lookup of parents
  const incomingEdges = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!incomingEdges.has(edge.to)) {
      incomingEdges.set(edge.to, []);
    }
    incomingEdges.get(edge.to)!.push(edge.from);
  });

  // Store calculated CENTER positions (X for TB, Y for LR)
  const calculatedCenterPositions = new Map<string, number>();

  // Track current level position (Y for TB, X for LR)
  let currentFlowPos = direction === "TB" ? startY : startX;

  // Helper to get node dimension in the non-flow direction (Width for TB)
  const getNodeSize = (id: string) => {
    const node = nodeMap.get(id);
    if (!node) return 0;
    return direction === "TB" ? node.size.width : node.size.height;
  };

  // Helper to get node dimension in the flow direction (Height for TB)
  const getNodeFlowSize = (id: string) => {
    const node = nodeMap.get(id);
    if (!node) return 0;
    return direction === "TB" ? node.size.height : node.size.width;
  };

  // Check if there are edges with labels between levels
  const hasLabeledEdgesBetweenLevels = (
    fromLevel: number,
    toLevel: number,
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

  levels.forEach((level, levelIndex) => {
    // 1. Calculate desired positions based on parents
    const nodeData = level.map((nodeId) => {
      const parents = incomingEdges.get(nodeId) || [];
      // Filter parents that have been positioned (should be all from previous levels)
      const positionedParents = parents.filter((p) =>
        calculatedCenterPositions.has(p),
      );

      let desiredPos = 0;
      if (positionedParents.length > 0) {
        const sum = positionedParents.reduce(
          (acc, p) => acc + (calculatedCenterPositions.get(p) || 0),
          0,
        );
        desiredPos = sum / positionedParents.length;
      } else if (levelIndex > 0) {
        // If no parents (e.g. disconnected), try to stay near 0 (center)
        desiredPos = 0;
      }

      return {
        id: nodeId,
        desiredPos,
        width: getNodeSize(nodeId),
        flowSize: getNodeFlowSize(nodeId),
      };
    });

    // 2. Sort nodes by desired position to preserve relative order
    nodeData.sort((a, b) => a.desiredPos - b.desiredPos);

    // 3. Resolve overlaps (Left-to-Right pass)
    const placedPositions: number[] = [];

    nodeData.forEach((node, i) => {
      let pos = node.desiredPos;

      // Constraint: Must be to the right of previous node
      if (i > 0) {
        const prevPos = placedPositions[i - 1];
        const prevHalfWidth = nodeData[i - 1].width / 2;
        const currHalfWidth = node.width / 2;
        const minPos =
          prevPos + prevHalfWidth + gapBetweenNodes + currHalfWidth;
        if (pos < minPos) {
          pos = minPos;
        }
      }
      placedPositions.push(pos);
    });

    // The L->R pass pushes everything right.
    // We need to center the group relative to the desired positions.
    let totalDeviation = 0;
    nodeData.forEach((node, i) => {
      totalDeviation += placedPositions[i] - node.desiredPos;
    });
    const avgDeviation = totalDeviation / nodeData.length;

    // Shift back by average deviation
    const finalPositions = placedPositions.map((p) => p - avgDeviation);

    // Store results
    nodeData.forEach((node, i) => {
      calculatedCenterPositions.set(node.id, finalPositions[i]);
    });

    // 4. Assign positions to nodes (converting center to top-left)
    nodeData.forEach((node, i) => {
      const centerPos = finalPositions[i];
      const topLeftPos = centerPos - node.width / 2;

      const stateNode = nodeMap.get(node.id)!;
      if (direction === "TB") {
        stateNode.position = { x: topLeftPos, y: currentFlowPos };
      } else {
        stateNode.position = { x: currentFlowPos, y: topLeftPos };
      }
    });

    // 5. Update Flow Position (Y)
    const maxFlowSize =
      nodeData.length > 0 ? Math.max(...nodeData.map((n) => n.flowSize)) : 0;

    // Calculate spacing for next level
    if (levelIndex < levels.length - 1) {
      let spacingToNext = gapBetweenLevels + maxFlowSize;

      // Check if there are labeled edges between this level and the next
      if (hasLabeledEdgesBetweenLevels(levelIndex, levelIndex + 1)) {
        spacingToNext += labeledEdgeSpacing;
      }

      currentFlowPos += spacingToNext;
    } else {
      currentFlowPos += maxFlowSize;
    }
  });

  // 6. Normalize coordinates (shift so min X/Y is startX/startY)
  let minPos = Infinity;
  let maxPos = -Infinity;

  nodeMap.forEach((node) => {
    const pos = direction === "TB" ? node.position.x : node.position.y;
    const size = direction === "TB" ? node.size.width : node.size.height;
    minPos = Math.min(minPos, pos);
    maxPos = Math.max(maxPos, pos + size);
  });

  const shift = (direction === "TB" ? startX : startY) - minPos;

  nodeMap.forEach((node) => {
    if (direction === "TB") {
      node.position.x += shift;
    } else {
      node.position.y += shift;
    }
  });

  const totalWidth =
    direction === "TB" ? maxPos - minPos + startX * 2 : currentFlowPos + startX;
  const totalHeight =
    direction === "TB" ? currentFlowPos + startY : maxPos - minPos + startY * 2;

  return { width: totalWidth, height: totalHeight };
}
