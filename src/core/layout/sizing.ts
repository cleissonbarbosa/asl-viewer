import { StateDefinition, StateNode } from "../../types";

/**
 * Determines the size of a state node based on its type and properties
 */
export function getStateSize(
  type: string,
  isStartState = false,
  isEndState = false,
): { width: number; height: number } {
  // All regular state nodes are now rectangular (no more circular end states)
  switch (type) {
    case "Choice":
      return { width: 240, height: 60 };
    case "Parallel":
    case "Map":
      return { width: 260, height: 60 };
    case "Task":
      return { width: 230, height: 60 };
    case "Wait":
      return { width: 220, height: 60 };
    default:
      return { width: 220, height: 60 };
  }
}

/**
 * Calculates the bounds needed for a group container with improved spacing
 */
export function calculateGroupBounds(
  type: string,
  children: StateNode[],
): { width: number; height: number } {
  if (children.length === 0) {
    return { width: 350, height: 250 }; // Increased default size
  }

  if (type === "Parallel") {
    // Group children by branch
    const branches = new Map<number, StateNode[]>();
    children.forEach((child) => {
      const branchIndex = child.branchIndex ?? 0;
      if (!branches.has(branchIndex)) {
        branches.set(branchIndex, []);
      }
      branches.get(branchIndex)!.push(child);
    });

    const branchCount = branches.size;
    const maxBranchHeight = Math.max(
      ...Array.from(branches.values()).map(
        (branchChildren) =>
          branchChildren.length * 60 + (branchChildren.length - 1) * 20, // Compact spacing
      ),
    );

    return {
      width: Math.max(300, branchCount * 240 + (branchCount - 1) * 20 + 40), // Compact width
      height: Math.max(150, maxBranchHeight + 100), // Compact padding and height
    };
  } else if (type === "Map") {
    // Map iterator children are arranged vertically with better spacing
    const totalHeight = children.length * 60 + (children.length - 1) * 20; // Compact spacing
    return {
      width: 300, // Compact width
      height: Math.max(150, totalHeight + 100), // Compact padding
    };
  }

  return { width: 300, height: 150 }; // Compact default size
}
