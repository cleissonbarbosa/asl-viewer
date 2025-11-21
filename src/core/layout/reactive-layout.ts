import { StateNode, Connection } from "../../types";
import { positionChildNodes } from "./group-nodes";

export interface LayoutCache {
  originalPositions: Map<string, { x: number; y: number }>;
  expandedNodes: Set<string>;
}

/**
 * Calculates reactive layout adjustments when group nodes are expanded/collapsed
 */
export function calculateReactiveLayout(
  nodes: StateNode[],
  edges: Connection[],
  expandedNodeIds: Set<string>,
  layoutCache: LayoutCache,
  direction: "TB" | "LR" = "TB",
): StateNode[] {
  // Make a copy of nodes to avoid mutation
  const updatedNodes = nodes.map((node) => ({ ...node }));

  // Store original positions if not already cached
  if (layoutCache.originalPositions.size === 0) {
    updatedNodes.forEach((node) => {
      layoutCache.originalPositions.set(node.id, { ...node.position });
    });
  }

  // Check if expansion state has changed
  const hasChanges = !setsEqual(expandedNodeIds, layoutCache.expandedNodes);
  if (!hasChanges) {
    return updatedNodes;
  }

  // Update cache
  layoutCache.expandedNodes = new Set(expandedNodeIds);

  // Separate group nodes and regular nodes
  const groupNodes = updatedNodes.filter((node) => node.isGroup);
  const regularNodes = updatedNodes.filter(
    (node) => !node.isGroup && !node.parentId,
  );

  // Sort nodes by position for proper adjustment calculation
  const sortedNodes = [...groupNodes, ...regularNodes].sort((a, b) => {
    if (direction === "TB") {
      return a.position.y - b.position.y;
    } else {
      return a.position.x - b.position.x;
    }
  });

  // Calculate space requirements for each expanded group
  const spaceRequirements = new Map<string, number>();
  groupNodes.forEach((groupNode) => {
    if (expandedNodeIds.has(groupNode.id)) {
      const requiredSpace = calculateExpandedGroupSpace(groupNode, direction);
      spaceRequirements.set(groupNode.id, requiredSpace);
    }
  });

  // Adjust positions based on expanded groups
  adjustNodePositions(
    sortedNodes,
    spaceRequirements,
    layoutCache.originalPositions,
    expandedNodeIds,
    direction,
  );

  // Position child nodes for expanded groups
  groupNodes.forEach((groupNode) => {
    if (expandedNodeIds.has(groupNode.id) && groupNode.children) {
      // Update group size for expanded state
      if (groupNode.groupBounds) {
        groupNode.size = { ...groupNode.groupBounds };
      }

      // Position child nodes relative to the group
      positionChildNodes(groupNode, groupNode.children, 80);

      // Update existing child nodes in the result instead of adding duplicates
      groupNode.children.forEach((child) => {
        const existingIndex = updatedNodes.findIndex((n) => n.id === child.id);
        if (existingIndex >= 0) {
          // Update existing child node with new position
          updatedNodes[existingIndex] = {
            ...updatedNodes[existingIndex],
            ...child,
          };
        }
        // Don't add new children nodes to updatedNodes as they should only be rendered inside the group
      });
    } else {
      // Restore original collapsed size
      const originalSize = getCollapsedSize(groupNode.type);
      groupNode.size = originalSize;
    }
  });

  return updatedNodes;
}

/**
 * Adjusts node positions to accommodate expanded groups
 */
function adjustNodePositions(
  sortedNodes: StateNode[],
  spaceRequirements: Map<string, number>,
  originalPositions: Map<string, { x: number; y: number }>,
  expandedNodeIds: Set<string>,
  direction: "TB" | "LR",
): void {
  let cumulativeOffset = 0;
  const processedNodes = new Set<string>();

  sortedNodes.forEach((node) => {
    if (processedNodes.has(node.id)) return;

    const originalPos = originalPositions.get(node.id);
    if (!originalPos) return;

    // Apply cumulative offset to position based on direction
    if (direction === "TB") {
      node.position = {
        x: originalPos.x,
        y: originalPos.y + cumulativeOffset,
      };
    } else {
      node.position = {
        x: originalPos.x + cumulativeOffset,
        y: originalPos.y,
      };
    }

    processedNodes.add(node.id);

    // If this is an expanded group, add its space requirement to the offset
    if (node.isGroup && expandedNodeIds.has(node.id)) {
      const requiredSpace = spaceRequirements.get(node.id) || 0;
      cumulativeOffset += requiredSpace;
    }
  });
}

/**
 * Calculates the additional space needed when a group is expanded
 */
function calculateExpandedGroupSpace(
  groupNode: StateNode,
  direction: "TB" | "LR",
): number {
  if (!groupNode.groupBounds) return 0;

  const collapsedSize = getCollapsedSize(groupNode.type);
  const expandedSize =
    direction === "TB"
      ? groupNode.groupBounds.height
      : groupNode.groupBounds.width;
  const collapsedDimension =
    direction === "TB" ? collapsedSize.height : collapsedSize.width;

  // Return the additional space needed (expanded size - collapsed size)
  return Math.max(0, expandedSize - collapsedDimension + 80); // Extra 80px for spacing
}

/**
 * Gets the collapsed size for a group node type
 */
function getCollapsedSize(type: string): { width: number; height: number } {
  switch (type) {
    case "Parallel":
    case "Map":
      return { width: 260, height: 60 };
    default:
      return { width: 220, height: 60 };
  }
}

/**
 * Utility function to check if two sets are equal
 */
function setsEqual<T>(setA: Set<T>, setB: Set<T>): boolean {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

/**
 * Calculates improved spacing between levels and nodes
 */
export function calculateImprovedSpacing(
  nodes: StateNode[],
  edges: Connection[],
): { nodeSpacing: number; levelSpacing: number } {
  // Analyze edge complexity to determine spacing
  const hasLabeledEdges = edges.some(
    (edge) => edge.label && edge.label.trim().length > 0,
  );
  const hasMultipleChoices =
    edges.filter((edge) => edge.type === "choice").length > 1;
  const hasErrorHandling = edges.some((edge) => edge.type === "error");

  // Base spacing values
  let nodeSpacing = 60; // Horizontal spacing between nodes
  let levelSpacing = 60; // Vertical spacing between levels

  // Adjust spacing based on complexity
  if (hasLabeledEdges) {
    nodeSpacing += 20;
    levelSpacing += 20;
  }

  if (hasMultipleChoices) {
    nodeSpacing += 20;
    levelSpacing += 10;
  }

  if (hasErrorHandling) {
    nodeSpacing += 10;
    levelSpacing += 10;
  }

  // Check for group nodes that might need extra space
  const hasGroupNodes = nodes.some((node) => node.isGroup);
  if (hasGroupNodes) {
    nodeSpacing += 20;
    levelSpacing += 20;
  }

  return {
    nodeSpacing: Math.min(nodeSpacing, 200), // Cap at reasonable maximum
    levelSpacing: Math.min(levelSpacing, 150),
  };
}
