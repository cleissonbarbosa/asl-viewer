import { ASLDefinition, StateNode } from "../../types";
import { getStateSize } from "./sizing";

/**
 * Creates child nodes for Parallel state branches
 */
export function createParallelChildNodes(
  parentId: string,
  branches: ASLDefinition[],
): StateNode[] {
  const childNodes: StateNode[] = [];

  branches.forEach((branch, branchIndex) => {
    // Create nodes for each state in the branch
    Object.entries(branch.States).forEach(([stateName, state]) => {
      const childId = `${parentId}_branch${branchIndex}_${stateName}`;
      const childNode: StateNode = {
        id: childId,
        name: stateName,
        type: state.Type,
        definition: state,
        position: { x: 0, y: 0 }, // Will be set by layout algorithm
        size: getStateSize(state.Type),
        connections: [],
        isStartState: stateName === branch.StartAt,
        isEndState:
          state.End === true ||
          state.Type === "Succeed" ||
          state.Type === "Fail",
        parentId,
        branchIndex,
      };
      childNodes.push(childNode);
    });

    // Create connections within the branch
    Object.entries(branch.States).forEach(([stateName, state]) => {
      if (state.Next) {
        const fromId = `${parentId}_branch${branchIndex}_${stateName}`;
        const toId = `${parentId}_branch${branchIndex}_${state.Next}`;

        // Only add if the target state exists in this branch
        const targetExists = childNodes.some((node) => node.id === toId);
        if (targetExists) {
          const fromNode = childNodes.find((node) => node.id === fromId);
          if (fromNode) {
            fromNode.connections.push({
              from: fromId,
              to: toId,
              type: "next",
            });
          }
        }
      }
    });
  });

  return childNodes;
}

/**
 * Creates child nodes for Map state iterator
 */
export function createMapChildNodes(
  parentId: string,
  iterator: ASLDefinition,
): StateNode[] {
  const childNodes: StateNode[] = [];

  // Create nodes for each state in the iterator
  Object.entries(iterator.States).forEach(([stateName, state]) => {
    const childId = `${parentId}_iterator_${stateName}`;
    const childNode: StateNode = {
      id: childId,
      name: stateName,
      type: state.Type,
      definition: state,
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      size: getStateSize(state.Type),
      connections: [],
      isStartState: stateName === iterator.StartAt,
      isEndState:
        state.End === true || state.Type === "Succeed" || state.Type === "Fail",
      parentId,
      branchIndex: 0, // Map has only one iterator
    };
    childNodes.push(childNode);
  });

  // Create connections within the iterator
  Object.entries(iterator.States).forEach(([stateName, state]) => {
    if (state.Next) {
      const fromId = `${parentId}_iterator_${stateName}`;
      const toId = `${parentId}_iterator_${state.Next}`;

      // Only add if the target state exists in the iterator
      const targetExists = childNodes.some((node) => node.id === toId);
      if (targetExists) {
        const fromNode = childNodes.find((node) => node.id === fromId);
        if (fromNode) {
          fromNode.connections.push({
            from: fromId,
            to: toId,
            type: "next",
          });
        }
      }
    }
  });

  return childNodes;
}

/**
 * Positions child nodes around their parent node with improved spacing
 */
export function positionChildNodes(
  parentNode: StateNode,
  children: StateNode[],
  nodeSpacing: number,
): void {
  if (children.length === 0) return;

  const childSpacing = 140; // Compact spacing between branches
  const verticalOffset = 60; // Compact vertical offset from parent
  const verticalSpacing = 60; // Compact spacing between nodes in same branch

  if (parentNode.type === "Parallel") {
    // Group children by branch
    const branches = new Map<number, StateNode[]>();
    children.forEach((child) => {
      const branchIndex = child.branchIndex ?? 0;
      if (!branches.has(branchIndex)) {
        branches.set(branchIndex, []);
      }
      branches.get(branchIndex)!.push(child);
    });

    // Position each branch with improved spacing
    let branchOffset = 0;
    const totalBranchWidth = (branches.size - 1) * childSpacing;
    const startOffset = -totalBranchWidth / 2;

    branches.forEach((branchChildren, branchIndex) => {
      const branchStartX = parentNode.position.x + startOffset + branchOffset;

      branchChildren.forEach((child, childIndex) => {
        child.position = {
          x: branchStartX,
          y:
            parentNode.position.y +
            verticalOffset +
            childIndex * verticalSpacing,
        };
      });

      branchOffset += childSpacing;
    });
  } else if (parentNode.type === "Map") {
    // Position iterator children in a vertical line with improved spacing
    const startX = parentNode.position.x;
    children.forEach((child, index) => {
      child.position = {
        x: startX,
        y: parentNode.position.y + verticalOffset + index * verticalSpacing,
      };
    });
  }
}
