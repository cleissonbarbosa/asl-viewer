import { StateNode, Connection } from "../../types";
import { calculateImprovedSpacing } from "./reactive-layout";

/**
 * Calculates hierarchical layout for nodes using BFS algorithm
 */
export function calculateHierarchicalLayout(
  nodes: StateNode[],
  edges: Connection[],
  startAt: string,
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
  const layout = positionNodesInLevels(levels, nodeMap, edges, spacingConfig);

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
  spacingConfig?: { nodeSpacing: number; levelSpacing: number },
): { width: number; height: number } {
  // Use provided spacing or fall back to defaults
  const nodeSpacing = spacingConfig?.nodeSpacing || 340;
  const baseLevelSpacing = spacingConfig?.levelSpacing || 150;
  const labeledEdgeSpacing = 50; // Extra spacing for labeled edges
  const startX = 100;
  const startY = 100;

  let maxWidth = 0;
  let currentY = startY;

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

      // Add extra space if current level has group nodes
      const hasGroupNodes = level.some((nodeId) => {
        const node = nodeMap.get(nodeId);
        return node && node.isGroup;
      });

      if (hasGroupNodes) {
        spacingToNext += 50; // Extra space for group nodes
      }

      currentY += spacingToNext;
    }
  });

  const totalWidth = maxWidth + 200;
  const totalHeight = currentY + 100;

  return { width: totalWidth, height: totalHeight };
}
