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
          branchChildren.length * 90 + (branchChildren.length - 1) * 20, // Increased spacing
      ),
    );

    return {
      width: Math.max(450, branchCount * 200 + (branchCount - 1) * 40 + 60), // Increased width
      height: Math.max(250, maxBranchHeight + 150), // Increased padding and height
    };
  } else if (type === "Map") {
    // Map iterator children are arranged vertically with better spacing
    const totalHeight = children.length * 90 + (children.length - 1) * 20; // Increased spacing
    return {
      width: 350, // Increased width
      height: Math.max(250, totalHeight + 150), // Increased padding
    };
  }

  return { width: 350, height: 250 }; // Increased default size
}
