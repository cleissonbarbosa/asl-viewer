import { ASLDefinition, StateNode } from "../../types";
import { orderStatesByFlow } from "../asl-utils";
import { getStateSize } from "./sizing";

/**
 * Creates the child nodes of one nested workflow (a Parallel branch or a
 * Map item processor). Children are ordered by execution flow so the group
 * reads top to bottom.
 */
function createChildNodes(
  parentId: string,
  workflow: ASLDefinition,
  branchIndex: number,
  idPrefix: string,
): StateNode[] {
  if (!workflow || typeof workflow !== "object" || !workflow.States) {
    return [];
  }

  const nodes = new Map<string, StateNode>();
  for (const stateName of orderStatesByFlow(workflow)) {
    const state = workflow.States[stateName];
    if (!state || typeof state !== "object") continue;
    nodes.set(stateName, {
      id: `${idPrefix}${stateName}`,
      name: stateName,
      type: state.Type,
      definition: state,
      position: { x: 0, y: 0 },
      size: getStateSize(state.Type),
      connections: [],
      isStartState: stateName === workflow.StartAt,
      isEndState:
        state.End === true || state.Type === "Succeed" || state.Type === "Fail",
      parentId,
      branchIndex,
    });
  }

  // Connections within the nested workflow
  nodes.forEach((node, stateName) => {
    const next = workflow.States[stateName]?.Next;
    const target = next ? nodes.get(next) : undefined;
    if (target) {
      node.connections.push({ from: node.id, to: target.id, type: "next" });
    }
  });

  return Array.from(nodes.values());
}

/**
 * Creates child nodes for Parallel state branches
 */
export function createParallelChildNodes(
  parentId: string,
  branches: ASLDefinition[],
): StateNode[] {
  if (!Array.isArray(branches)) return [];
  return branches.flatMap((branch, branchIndex) =>
    createChildNodes(
      parentId,
      branch,
      branchIndex,
      `${parentId}_branch${branchIndex}_`,
    ),
  );
}

/**
 * Creates child nodes for a Map state item processor (or legacy iterator)
 */
export function createMapChildNodes(
  parentId: string,
  iterator: ASLDefinition,
): StateNode[] {
  return createChildNodes(parentId, iterator, 0, `${parentId}_iterator_`);
}
