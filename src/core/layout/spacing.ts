import { StateNode, Connection } from "../../types";

/**
 * Calculates spacing between levels and nodes based on graph complexity
 */
export function calculateImprovedSpacing(
  nodes: StateNode[],
  edges: Connection[],
): { nodeSpacing: number; levelSpacing: number } {
  // Analyze edge complexity to determine spacing
  let hasLabeledEdges = false;
  let choiceEdges = 0;
  let hasErrorHandling = false;
  for (const edge of edges) {
    if (edge.label && edge.label.trim().length > 0) hasLabeledEdges = true;
    if (edge.type === "choice") choiceEdges++;
    if (edge.type === "error") hasErrorHandling = true;
  }

  // Base spacing values
  let nodeSpacing = 60; // Spacing between nodes in the same level
  let levelSpacing = 60; // Spacing between levels

  // Adjust spacing based on complexity
  if (hasLabeledEdges) {
    nodeSpacing += 20;
    levelSpacing += 20;
  }

  if (choiceEdges > 1) {
    nodeSpacing += 20;
    levelSpacing += 10;
  }

  if (hasErrorHandling) {
    nodeSpacing += 10;
    levelSpacing += 10;
  }

  // Check for group nodes that might need extra space
  if (nodes.some((node) => node.isGroup)) {
    nodeSpacing += 20;
    levelSpacing += 20;
  }

  return {
    nodeSpacing: Math.min(nodeSpacing, 200), // Cap at reasonable maximum
    levelSpacing: Math.min(levelSpacing, 150),
  };
}
