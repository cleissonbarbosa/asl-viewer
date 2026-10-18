import { StateNode } from "../../types";

/**
 * Size of the artificial START / END pills.
 */
export const TERMINAL_NODE_SIZE = { width: 88, height: 34 };

/**
 * Geometry of an expanded Parallel / Map group. The group node component
 * renders with exactly these values, so the size used by the layout always
 * matches what is drawn on screen.
 */
export const GROUP_LAYOUT = {
  headerHeight: 60,
  padding: 12,
  columnWidth: 200,
  columnGap: 12,
  columnLabelHeight: 22,
  childHeight: 40,
  childGap: 16,
  minWidth: 300,
} as const;

/**
 * Determines the size of a state node based on its type and properties
 */
export function getStateSize(type: string): { width: number; height: number } {
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
 * Groups child nodes by branch index, preserving their order.
 */
export function groupChildrenByBranch(
  children: StateNode[],
): Map<number, StateNode[]> {
  const branches = new Map<number, StateNode[]>();
  for (const child of children) {
    const branchIndex = child.branchIndex ?? 0;
    let branch = branches.get(branchIndex);
    if (!branch) {
      branch = [];
      branches.set(branchIndex, branch);
    }
    branch.push(child);
  }
  return branches;
}

/**
 * Calculates the size of an expanded group container
 */
export function calculateGroupBounds(
  type: string,
  children: StateNode[],
): { width: number; height: number } {
  if (children.length === 0) {
    return { width: 350, height: 250 };
  }

  const {
    headerHeight,
    padding,
    columnWidth,
    columnGap,
    columnLabelHeight,
    childHeight,
    childGap,
    minWidth,
  } = GROUP_LAYOUT;

  const columns =
    type === "Parallel"
      ? Array.from(groupChildrenByBranch(children).values())
      : [children];

  const tallestColumn = Math.max(
    ...columns.map(
      (column) =>
        columnLabelHeight +
        column.length * childHeight +
        Math.max(0, column.length - 1) * childGap,
    ),
  );

  return {
    width: Math.max(
      minWidth,
      padding * 2 +
        columns.length * columnWidth +
        (columns.length - 1) * columnGap,
    ),
    height: headerHeight + padding * 2 + tallestColumn,
  };
}
