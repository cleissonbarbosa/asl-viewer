import { ASLDefinition, StateDefinition, ValidationError } from "../types";
import { STATE_TYPES, getItemProcessor, getTransitions } from "./asl-utils";

const KNOWN_TYPES = new Set<string>(STATE_TYPES);
const TERMINAL_TYPES = new Set<string>(["Choice", "Succeed", "Fail"]);

/**
 * Validates an ASL definition for syntax and semantic errors.
 *
 * Nested workflows (Parallel branches and Map item processors) are validated
 * recursively; their paths are prefixed with the parent state, e.g.
 * `States.Process.Branches[0].States.Step.Next`.
 */
export function validateASLDefinition(
  definition: ASLDefinition,
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!definition || typeof definition !== "object") {
    errors.push({
      message: "Definition must be an object",
      path: "root",
      severity: "error",
    });
    return errors;
  }
  validateWorkflow(definition, "", errors);
  return errors;
}

function validateWorkflow(
  definition: ASLDefinition,
  prefix: string,
  errors: ValidationError[],
): void {
  // Early validation for required fields
  if (!definition.StartAt) {
    errors.push({
      message: "StartAt field is required",
      path: `${prefix}StartAt`,
      severity: "error",
    });
  }

  // Check States existence and cache state names for performance
  const hasStates =
    !!definition.States && typeof definition.States === "object";
  const stateNames = hasStates ? Object.keys(definition.States) : [];

  if (!hasStates || stateNames.length === 0) {
    errors.push({
      message: "States field is required and must contain at least one state",
      path: `${prefix}States`,
      severity: "error",
    });
    return;
  }

  // Create state name lookup set for O(1) existence checks
  const stateNameSet = new Set(stateNames);

  // Validate StartAt references an existing state
  if (definition.StartAt && !stateNameSet.has(definition.StartAt)) {
    errors.push({
      message: `StartAt references non-existent state: ${definition.StartAt}`,
      path: `${prefix}StartAt`,
      severity: "error",
    });
  }

  // Validate each state with pre-computed state name set
  for (const stateName of stateNames) {
    validateState(
      stateName,
      definition.States[stateName],
      stateNameSet,
      `${prefix}States.${stateName}`,
      errors,
    );
  }

  // Check for unreachable states only if basic validation passes
  if (definition.StartAt && stateNameSet.has(definition.StartAt)) {
    const reachableStates = findReachableStates(definition);
    for (const stateName of stateNames) {
      if (!reachableStates.has(stateName)) {
        errors.push({
          message: `State "${stateName}" is unreachable`,
          path: `${prefix}States.${stateName}`,
          severity: "warning",
        });
      }
    }
  }
}

function validateState(
  stateName: string,
  state: StateDefinition,
  stateNameSet: Set<string>,
  basePath: string,
  errors: ValidationError[],
): void {
  if (!state || typeof state !== "object") {
    errors.push({
      message: `State "${stateName}" must be an object`,
      path: basePath,
      severity: "error",
    });
    return;
  }

  // Check required Type field
  if (!state.Type) {
    errors.push({
      message: "Type field is required for all states",
      path: `${basePath}.Type`,
      severity: "error",
    });
    return;
  }

  if (!KNOWN_TYPES.has(state.Type)) {
    errors.push({
      message: `Unknown state type "${state.Type}". Expected one of: ${STATE_TYPES.join(", ")}`,
      path: `${basePath}.Type`,
      severity: "error",
    });
    return;
  }

  // Pre-compute validation conditions to avoid repeated checks
  const hasResource = "Resource" in state && !!state.Resource;
  const hasChoices = Array.isArray(state.Choices);
  const hasNext = "Next" in state && !!state.Next;
  const hasEnd = "End" in state && !!state.End;

  // Validate state type-specific requirements
  switch (state.Type) {
    case "Pass":
      // Pass states can have Result but not Resource
      if (hasResource) {
        errors.push({
          message: "Pass states cannot have Resource field",
          path: `${basePath}.Resource`,
          severity: "error",
        });
      }
      break;

    case "Task":
      // Task states must have Resource
      if (!hasResource) {
        errors.push({
          message: "Task states must have Resource field",
          path: `${basePath}.Resource`,
          severity: "error",
        });
      }
      break;

    case "Choice":
      // Choice states must have Choices array and cannot have End or Next
      if (!hasChoices || state.Choices!.length === 0) {
        errors.push({
          message: "Choice states must have non-empty Choices array",
          path: `${basePath}.Choices`,
          severity: "error",
        });
      }
      if (hasEnd) {
        errors.push({
          message: "Choice states cannot have End field",
          path: `${basePath}.End`,
          severity: "error",
        });
      }
      if (hasNext) {
        errors.push({
          message: "Choice states cannot have Next field",
          path: `${basePath}.Next`,
          severity: "error",
        });
      }
      break;

    case "Wait": {
      // Wait states must have exactly one time specification
      const timeFields = [
        "Seconds",
        "Timestamp",
        "SecondsPath",
        "TimestampPath",
      ] as const;
      const presentTimeFields = timeFields.filter(
        (field) => field in state && state[field] !== undefined,
      );

      if (presentTimeFields.length === 0) {
        errors.push({
          message:
            "Wait states must have one of: Seconds, Timestamp, SecondsPath, or TimestampPath",
          path: basePath,
          severity: "error",
        });
      } else if (presentTimeFields.length > 1) {
        errors.push({
          message: "Wait states can only have one time specification field",
          path: basePath,
          severity: "error",
        });
      }
      break;
    }

    case "Parallel": {
      // Parallel states must have Branches
      if (
        !state.Branches ||
        !Array.isArray(state.Branches) ||
        state.Branches.length === 0
      ) {
        errors.push({
          message: "Parallel states must have non-empty Branches array",
          path: `${basePath}.Branches`,
          severity: "error",
        });
      } else {
        state.Branches.forEach((branch, index) =>
          validateWorkflow(branch, `${basePath}.Branches[${index}].`, errors),
        );
      }
      break;
    }

    case "Map": {
      // Map states must have ItemProcessor (or the legacy Iterator)
      const processor = getItemProcessor(state);
      if (!processor) {
        errors.push({
          message:
            "Map states must have an ItemProcessor (or legacy Iterator) field",
          path: `${basePath}.ItemProcessor`,
          severity: "error",
        });
      } else {
        const field = state.ItemProcessor ? "ItemProcessor" : "Iterator";
        validateWorkflow(processor, `${basePath}.${field}.`, errors);
      }
      break;
    }

    case "Fail": {
      // Fail states cannot have Next and automatically end
      if (hasNext) {
        errors.push({
          message: "Fail states cannot have Next field",
          path: `${basePath}.Next`,
          severity: "error",
        });
      }
      break;
    }

    case "Succeed": {
      // Succeed states cannot have Next and automatically end
      if (hasNext) {
        errors.push({
          message: "Succeed states cannot have Next field",
          path: `${basePath}.Next`,
          severity: "error",
        });
      }
      break;
    }
  }

  // Non-terminal states must declare how the execution continues
  if (!TERMINAL_TYPES.has(state.Type)) {
    if (hasNext && hasEnd) {
      errors.push({
        message: "States cannot have both Next and End fields",
        path: basePath,
        severity: "error",
      });
    } else if (!hasNext && !hasEnd) {
      errors.push({
        message: `${state.Type} states should have either a Next or End field`,
        path: basePath,
        severity: "warning",
      });
    }
  }

  // Validate Next references with O(1) lookup
  if (hasNext && !stateNameSet.has(state.Next!)) {
    errors.push({
      message: `Next references non-existent state: ${state.Next}`,
      path: `${basePath}.Next`,
      severity: "error",
    });
  }

  // Validate Choice references
  if (hasChoices) {
    state.Choices!.forEach((choice, i) => {
      if (!choice || typeof choice !== "object") return;
      if (!choice.Next) {
        errors.push({
          message: "Choice rules must have a Next field",
          path: `${basePath}.Choices[${i}].Next`,
          severity: "error",
        });
      } else if (!stateNameSet.has(choice.Next)) {
        errors.push({
          message: `Choice rule references non-existent state: ${choice.Next}`,
          path: `${basePath}.Choices[${i}].Next`,
          severity: "error",
        });
      }
    });
  }

  // Validate Default reference for Choice states
  if (state.Default && !stateNameSet.has(state.Default)) {
    errors.push({
      message: `Default references non-existent state: ${state.Default}`,
      path: `${basePath}.Default`,
      severity: "error",
    });
  }

  // Validate Catch references
  if (Array.isArray(state.Catch)) {
    state.Catch.forEach((catchDef, i) => {
      if (!catchDef || typeof catchDef !== "object") return;
      if (!Array.isArray(catchDef.ErrorEquals)) {
        errors.push({
          message: "Catch blocks must have an ErrorEquals array",
          path: `${basePath}.Catch[${i}].ErrorEquals`,
          severity: "error",
        });
      }
      if (!stateNameSet.has(catchDef.Next)) {
        errors.push({
          message: `Catch references non-existent state: ${catchDef.Next}`,
          path: `${basePath}.Catch[${i}].Next`,
          severity: "error",
        });
      }
    });
  }

  // Validate Retry blocks
  if (Array.isArray(state.Retry)) {
    state.Retry.forEach((retry, i) => {
      if (retry && !Array.isArray(retry.ErrorEquals)) {
        errors.push({
          message: "Retry blocks must have an ErrorEquals array",
          path: `${basePath}.Retry[${i}].ErrorEquals`,
          severity: "error",
        });
      }
    });
  }
}

/**
 * Returns the set of top-level state names reachable from `StartAt`.
 * Nested workflows are validated separately, in their own scope.
 */
function findReachableStates(definition: ASLDefinition): Set<string> {
  const reachable = new Set<string>();

  // Early return if States is not defined or StartAt is missing
  if (!definition.States || !definition.StartAt) {
    return reachable;
  }

  // Iterative DFS with an explicit stack
  const toVisit: string[] = [definition.StartAt];
  const states = definition.States;

  while (toVisit.length > 0) {
    const current = toVisit.pop()!;

    // Skip if already visited or state doesn't exist
    if (reachable.has(current) || !states[current]) {
      continue;
    }

    reachable.add(current);
    for (const next of getTransitions(states[current])) {
      if (!reachable.has(next)) toVisit.push(next);
    }
  }

  return reachable;
}

/**
 * Parses ASL definition from string to object
 */
export function parseASLDefinition(
  definition: string | ASLDefinition,
): ASLDefinition {
  if (typeof definition === "string") {
    try {
      return JSON.parse(definition);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error}`);
    }
  }
  return definition;
}
