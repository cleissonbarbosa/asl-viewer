import { ASLDefinition, StateDefinition, StateType } from "../types";

/**
 * Workflow statistics
 */
export interface WorkflowStatistics {
  /** Total number of states in the workflow */
  totalStates: number;
  /** Count of states by type */
  stateTypeCounts: Record<StateType, number>;
  /** Maximum depth of the workflow (longest path from start to any end state) */
  maxDepth: number;
  /** Total number of connections/transitions */
  totalConnections: number;
  /** Number of error handling configurations (Retry + Catch) */
  errorHandlingCount: number;
  /** Number of Parallel branches */
  parallelBranchCount: number;
  /** Whether the workflow has cycles (loops) */
  hasCycles: boolean;
  /** Cyclic paths found in the workflow */
  cyclicPaths: string[][];
  /** States that are terminal (end states) */
  terminalStates: string[];
  /** States with error handling */
  statesWithErrorHandling: string[];
  /** Estimated complexity score (1-10) */
  complexityScore: number;
}

const STATE_TYPES: StateType[] = [
  "Pass",
  "Task",
  "Choice",
  "Wait",
  "Succeed",
  "Fail",
  "Parallel",
  "Map",
];

/**
 * Analyzes a workflow definition and returns comprehensive statistics
 */
export function getWorkflowStatistics(
  definition: ASLDefinition,
): WorkflowStatistics {
  const stateTypeCounts = {} as Record<StateType, number>;
  STATE_TYPES.forEach((type) => (stateTypeCounts[type] = 0));

  const states = definition.States || {};
  const stateNames = Object.keys(states);
  const totalStates = stateNames.length;

  // Count state types
  for (const state of Object.values(states)) {
    if (state.Type && stateTypeCounts[state.Type] !== undefined) {
      stateTypeCounts[state.Type]++;
    }
  }

  // Count connections
  let totalConnections = 0;
  let errorHandlingCount = 0;
  let parallelBranchCount = 0;
  const statesWithErrorHandling: string[] = [];
  const terminalStates: string[] = [];

  for (const [stateName, state] of Object.entries(states)) {
    // Count Next connections
    if (state.Next) totalConnections++;

    // Count Choice connections
    if (state.Choices) {
      totalConnections += state.Choices.length;
    }

    // Count Default connection
    if (state.Default) totalConnections++;

    // Count error handling
    if (state.Retry) {
      errorHandlingCount += state.Retry.length;
      if (!statesWithErrorHandling.includes(stateName)) {
        statesWithErrorHandling.push(stateName);
      }
    }
    if (state.Catch) {
      errorHandlingCount += state.Catch.length;
      totalConnections += state.Catch.length;
      if (!statesWithErrorHandling.includes(stateName)) {
        statesWithErrorHandling.push(stateName);
      }
    }

    // Count parallel branches
    if (state.Branches) {
      parallelBranchCount += state.Branches.length;
    }

    // Find terminal states
    if (
      state.End === true ||
      state.Type === "Succeed" ||
      state.Type === "Fail"
    ) {
      terminalStates.push(stateName);
    }
  }

  // Calculate max depth using BFS
  const maxDepth = calculateMaxDepth(definition);

  // Detect cycles
  const { hasCycles, cyclicPaths } = detectCycles(definition);

  // Calculate complexity score
  const complexityScore = calculateComplexityScore({
    totalStates,
    stateTypeCounts,
    totalConnections,
    errorHandlingCount,
    parallelBranchCount,
    hasCycles,
    maxDepth,
  });

  return {
    totalStates,
    stateTypeCounts,
    maxDepth,
    totalConnections,
    errorHandlingCount,
    parallelBranchCount,
    hasCycles,
    cyclicPaths,
    terminalStates,
    statesWithErrorHandling,
    complexityScore,
  };
}

/**
 * Calculates the maximum depth (longest path) in the workflow
 */
function calculateMaxDepth(definition: ASLDefinition): number {
  if (!definition.StartAt || !definition.States) return 0;

  const states = definition.States;
  let maxDepth = 0;

  function dfs(stateName: string, depth: number, visited: Set<string>): void {
    if (visited.has(stateName) || !states[stateName]) return;

    visited.add(stateName);
    maxDepth = Math.max(maxDepth, depth);

    const state = states[stateName];

    // Follow Next
    if (state.Next && !visited.has(state.Next)) {
      dfs(state.Next, depth + 1, new Set(visited));
    }

    // Follow Choices
    if (state.Choices) {
      for (const choice of state.Choices) {
        if (choice.Next && !visited.has(choice.Next)) {
          dfs(choice.Next, depth + 1, new Set(visited));
        }
      }
    }

    // Follow Default
    if (state.Default && !visited.has(state.Default)) {
      dfs(state.Default, depth + 1, new Set(visited));
    }

    // Follow Catch
    if (state.Catch) {
      for (const catchDef of state.Catch) {
        if (catchDef.Next && !visited.has(catchDef.Next)) {
          dfs(catchDef.Next, depth + 1, new Set(visited));
        }
      }
    }
  }

  dfs(definition.StartAt, 1, new Set<string>());

  return maxDepth;
}

/**
 * Detects cycles (loops) in the workflow
 */
export function detectCycles(definition: ASLDefinition): {
  hasCycles: boolean;
  cyclicPaths: string[][];
} {
  if (!definition.StartAt || !definition.States) {
    return { hasCycles: false, cyclicPaths: [] };
  }

  const states = definition.States;
  const cyclicPaths: string[][] = [];
  const globalVisited = new Set<string>();

  function getNextStates(state: StateDefinition): string[] {
    const nexts: string[] = [];
    if (state.Next) nexts.push(state.Next);
    if (state.Choices) {
      for (const choice of state.Choices) {
        if (choice.Next) nexts.push(choice.Next);
      }
    }
    if (state.Default) nexts.push(state.Default);
    if (state.Catch) {
      for (const catchDef of state.Catch) {
        nexts.push(catchDef.Next);
      }
    }
    return nexts;
  }

  function dfs(stateName: string, path: string[], recStack: Set<string>): void {
    if (!states[stateName]) return;

    if (recStack.has(stateName)) {
      // Found a cycle - extract the cyclic path
      const cycleStart = path.indexOf(stateName);
      if (cycleStart !== -1) {
        const cyclePath = [...path.slice(cycleStart), stateName];
        // Avoid duplicate cycles
        const cycleKey = cyclePath.join("→");
        const alreadyFound = cyclicPaths.some((p) => p.join("→") === cycleKey);
        if (!alreadyFound) {
          cyclicPaths.push(cyclePath);
        }
      }
      return;
    }

    if (globalVisited.has(stateName)) return;

    recStack.add(stateName);
    path.push(stateName);

    const state = states[stateName];
    const nextStates = getNextStates(state);

    for (const next of nextStates) {
      dfs(next, [...path], new Set(recStack));
    }

    globalVisited.add(stateName);
  }

  dfs(definition.StartAt, [], new Set<string>());

  return {
    hasCycles: cyclicPaths.length > 0,
    cyclicPaths,
  };
}

/**
 * Calculate a complexity score from 1-10
 */
function calculateComplexityScore(params: {
  totalStates: number;
  stateTypeCounts: Record<StateType, number>;
  totalConnections: number;
  errorHandlingCount: number;
  parallelBranchCount: number;
  hasCycles: boolean;
  maxDepth: number;
}): number {
  let score = 0;

  // State count contribution (0-2)
  if (params.totalStates <= 3) score += 0.5;
  else if (params.totalStates <= 6) score += 1;
  else if (params.totalStates <= 12) score += 1.5;
  else score += 2;

  // State type variety (0-2)
  const typeVariety = Object.values(params.stateTypeCounts).filter(
    (c) => c > 0,
  ).length;
  score += Math.min(typeVariety * 0.4, 2);

  // Connection density (0-2)
  const density =
    params.totalStates > 0 ? params.totalConnections / params.totalStates : 0;
  score += Math.min(density * 0.8, 2);

  // Error handling (0-1)
  score += Math.min(params.errorHandlingCount * 0.25, 1);

  // Parallel branches (0-1)
  score += Math.min(params.parallelBranchCount * 0.3, 1);

  // Cycles (0-1)
  if (params.hasCycles) score += 1;

  // Depth contribution (0-1)
  score += Math.min(params.maxDepth * 0.15, 1);

  return Math.max(1, Math.min(10, Math.round(score)));
}
