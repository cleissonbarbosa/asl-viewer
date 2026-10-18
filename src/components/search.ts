import { StateNode } from "../types";
import { isArtificialNode } from "../core/asl-utils";
import { GROUP_LAYOUT, groupChildrenByBranch } from "../core/layout";

export interface SearchMatch {
  /** Id of the matching state (may be a state nested in a group). */
  id: string;
  /** Id of the top-level node that contains the match. */
  nodeId: string;
  /** Center of the match in flow coordinates. */
  center: { x: number; y: number };
}

/**
 * Center of a nested state inside an expanded group, matching the geometry
 * rendered by `ReactFlowGroupNode`.
 */
function childCenter(group: StateNode, child: StateNode) {
  const columns =
    group.type === "Parallel"
      ? Array.from(groupChildrenByBranch(group.children ?? []).values())
      : [group.children ?? []];
  const column = columns.findIndex((c) => c.includes(child));
  const row = column >= 0 ? columns[column].indexOf(child) : 0;
  const {
    headerHeight,
    padding,
    columnWidth,
    columnGap,
    columnLabelHeight,
    childHeight,
    childGap,
  } = GROUP_LAYOUT;
  return {
    x:
      group.position.x +
      padding +
      Math.max(0, column) * (columnWidth + columnGap) +
      columnWidth / 2,
    y:
      group.position.y +
      headerHeight +
      padding +
      columnLabelHeight +
      row * (childHeight + childGap) +
      childHeight / 2,
  };
}

function nodeCenter(node: StateNode) {
  return {
    x: node.position.x + node.size.width / 2,
    y: node.position.y + node.size.height / 2,
  };
}

/**
 * Locates a state (top-level or nested in a group) among laid-out nodes.
 */
export function locateState(
  nodes: StateNode[],
  stateId: string,
): SearchMatch | null {
  for (const node of nodes) {
    if (node.parentId) continue;
    if (node.id === stateId) {
      return { id: node.id, nodeId: node.id, center: nodeCenter(node) };
    }
    const child = node.children?.find((c) => c.id === stateId);
    if (child) {
      return {
        id: child.id,
        nodeId: node.id,
        center: node.isExpanded ? childCenter(node, child) : nodeCenter(node),
      };
    }
  }
  return null;
}

/**
 * Finds the states whose name contains `term` (case-insensitive), including
 * states nested in Parallel / Map groups. Matches are sorted in reading order.
 */
export function findSearchMatches(
  nodes: StateNode[],
  term: string,
): SearchMatch[] {
  const query = term.trim().toLowerCase();
  if (!query) return [];

  const matches: SearchMatch[] = [];
  for (const node of nodes) {
    if (node.parentId || isArtificialNode(node.id)) continue;
    if (node.name.toLowerCase().includes(query)) {
      matches.push({ id: node.id, nodeId: node.id, center: nodeCenter(node) });
    }
    for (const child of node.children ?? []) {
      if (child.name.toLowerCase().includes(query)) {
        matches.push({
          id: child.id,
          nodeId: node.id,
          center: node.isExpanded ? childCenter(node, child) : nodeCenter(node),
        });
      }
    }
  }

  return matches.sort(
    (a, b) => a.center.y - b.center.y || a.center.x - b.center.x,
  );
}
