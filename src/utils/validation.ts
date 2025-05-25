import { ASLDefinition, StateDefinition, ValidationError } from '../types';

/**
 * Validates an ASL definition for syntax and semantic errors
 */
export function validateASLDefinition(definition: ASLDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  // Early validation for required fields
  if (!definition.StartAt) {
    errors.push({
      message: 'StartAt field is required',
      path: 'StartAt',
      severity: 'error'
    });
  }

  // Check States existence and cache state names for performance
  const hasStates = definition.States && typeof definition.States === 'object';
  const stateNames = hasStates ? Object.keys(definition.States!) : [];
  
  if (!hasStates || stateNames.length === 0) {
    errors.push({
      message: 'States field is required and must contain at least one state',
      path: 'States',
      severity: 'error'
    });
    return errors; // Early return if no states
  }

  // Create state name lookup set for O(1) existence checks
  const stateNameSet = new Set(stateNames);

  // Validate StartAt references an existing state
  if (definition.StartAt && !stateNameSet.has(definition.StartAt)) {
    errors.push({
      message: `StartAt references non-existent state: ${definition.StartAt}`,
      path: 'StartAt',
      severity: 'error'
    });
  }

  // Validate each state with pre-computed state name set
  for (const [stateName, state] of Object.entries(definition.States!)) {
    const stateErrors = validateState(stateName, state, stateNameSet);
    errors.push(...stateErrors);
  }

  // Check for unreachable states only if basic validation passes
  if (definition.StartAt && stateNameSet.has(definition.StartAt)) {
    const reachableStates = findReachableStates(definition);
    for (const stateName of stateNames) {
      if (!reachableStates.has(stateName)) {
        errors.push({
          message: `State "${stateName}" is unreachable`,
          path: `States.${stateName}`,
          severity: 'warning'
        });
      }
    }
  }

  return errors;
}

function validateState(
  stateName: string, 
  state: StateDefinition, 
  stateNameSet: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const basePath = `States.${stateName}`;

  // Check required Type field
  if (!state.Type) {
    errors.push({
      message: 'Type field is required for all states',
      path: `${basePath}.Type`,
      severity: 'error'
    });
    return errors;
  }

  // Pre-compute validation conditions to avoid repeated checks
  const hasResource = 'Resource' in state && state.Resource;
  const hasChoices = state.Choices && Array.isArray(state.Choices);
  const hasNext = 'Next' in state && state.Next;
  const hasEnd = 'End' in state && state.End;

  // Validate state type-specific requirements
  switch (state.Type) {
    case 'Pass':
      // Pass states can have Result but not Resource
      if (hasResource) {
        errors.push({
          message: 'Pass states cannot have Resource field',
          path: `${basePath}.Resource`,
          severity: 'error'
        });
      }
      break;

    case 'Task':
      // Task states must have Resource
      if (!hasResource) {
        errors.push({
          message: 'Task states must have Resource field',
          path: `${basePath}.Resource`,
          severity: 'error'
        });
      }
      break;

    case 'Choice':
      // Choice states must have Choices array and cannot have End or Next
      if (!hasChoices || state.Choices!.length === 0) {
        errors.push({
          message: 'Choice states must have non-empty Choices array',
          path: `${basePath}.Choices`,
          severity: 'error'
        });
      }
      if (hasEnd) {
        errors.push({
          message: 'Choice states cannot have End field',
          path: `${basePath}.End`,
          severity: 'error'
        });
      }
      if (hasNext) {
        errors.push({
          message: 'Choice states cannot have Next field',
          path: `${basePath}.Next`,
          severity: 'error'
        });
      }
      break;

    case 'Wait':
      // Wait states must have exactly one time specification
      const timeFields = ['Seconds', 'Timestamp', 'SecondsPath', 'TimestampPath'] as const;
      const presentTimeFields = timeFields.filter(field => field in state && state[field] !== undefined);
      
      if (presentTimeFields.length === 0) {
        errors.push({
          message: 'Wait states must have one of: Seconds, Timestamp, SecondsPath, or TimestampPath',
          path: basePath,
          severity: 'error'
        });
      } else if (presentTimeFields.length > 1) {
        errors.push({
          message: 'Wait states can only have one time specification field',
          path: basePath,
          severity: 'error'
        });
      }
      break;

    case 'Parallel':
      // Parallel states must have Branches
      if (!state.Branches || !Array.isArray(state.Branches) || state.Branches.length === 0) {
        errors.push({
          message: 'Parallel states must have non-empty Branches array',
          path: `${basePath}.Branches`,
          severity: 'error'
        });
      }
      break;

    case 'Map':
      // Map states must have Iterator
      if (!state.Iterator) {
        errors.push({
          message: 'Map states must have Iterator field',
          path: `${basePath}.Iterator`,
          severity: 'error'
        });
      }
      break;

    case 'Fail':
      // Fail states cannot have Next and automatically end
      if (hasNext) {
        errors.push({
          message: 'Fail states cannot have Next field',
          path: `${basePath}.Next`,
          severity: 'error'
        });
      }
      break;

    case 'Succeed':
      // Succeed states cannot have Next and automatically end
      if (hasNext) {
        errors.push({
          message: 'Succeed states cannot have Next field',
          path: `${basePath}.Next`,
          severity: 'error'
        });
      }
      break;
  }

  // Validate Next references with O(1) lookup
  if (hasNext && !stateNameSet.has(state.Next!)) {
    errors.push({
      message: `Next references non-existent state: ${state.Next}`,
      path: `${basePath}.Next`,
      severity: 'error'
    });
  }

  // Validate Choice references with batch processing
  if (hasChoices) {
    for (let i = 0; i < state.Choices!.length; i++) {
      const choice = state.Choices![i];
      if (choice.Next && !stateNameSet.has(choice.Next)) {
        errors.push({
          message: `Choice rule references non-existent state: ${choice.Next}`,
          path: `${basePath}.Choices[${i}].Next`,
          severity: 'error'
        });
      }
    }
  }

  // Validate Default reference for Choice states
  if (state.Default && !stateNameSet.has(state.Default)) {
    errors.push({
      message: `Default references non-existent state: ${state.Default}`,
      path: `${basePath}.Default`,
      severity: 'error'
    });
  }

  // Validate Catch references with batch processing
  if (state.Catch && Array.isArray(state.Catch)) {
    for (let i = 0; i < state.Catch.length; i++) {
      const catchDef = state.Catch[i];
      if (!stateNameSet.has(catchDef.Next)) {
        errors.push({
          message: `Catch references non-existent state: ${catchDef.Next}`,
          path: `${basePath}.Catch[${i}].Next`,
          severity: 'error'
        });
      }
    }
  }

  return errors;
}

function findReachableStates(definition: ASLDefinition): Set<string> {
  const reachable = new Set<string>();
  
  // Early return if States is not defined or StartAt is missing
  if (!definition.States || !definition.StartAt) {
    return reachable;
  }

  // Use iterative approach with stack for better performance
  const toVisit: string[] = [definition.StartAt];
  const states = definition.States;

  while (toVisit.length > 0) {
    const current = toVisit.pop()!;
    
    // Skip if already visited or state doesn't exist
    if (reachable.has(current) || !states[current]) {
      continue;
    }

    reachable.add(current);
    const state = states[current];

    // Batch collect next states to minimize array operations
    const nextStates: string[] = [];

    // Add direct next state
    if (state.Next) {
      nextStates.push(state.Next);
    }

    // Add choice targets
    if (state.Choices) {
      for (const choice of state.Choices) {
        if (choice.Next) {
          nextStates.push(choice.Next);
        }
      }
    }

    // Add default choice target
    if (state.Default) {
      nextStates.push(state.Default);
    }

    // Add catch targets
    if (state.Catch) {
      for (const catchDef of state.Catch) {
        nextStates.push(catchDef.Next);
      }
    }

    // Add all collected states at once
    toVisit.push(...nextStates);

    // Handle parallel branches recursively (less common, kept separate)
    if (state.Branches) {
      for (const branch of state.Branches) {
        const branchReachable = findReachableStates(branch);
        for (const stateName of branchReachable) {
          reachable.add(stateName);
        }
      }
    }

    // Handle map iterator recursively (less common, kept separate)
    if (state.Iterator) {
      const iteratorReachable = findReachableStates(state.Iterator);
      for (const stateName of iteratorReachable) {
        reachable.add(stateName);
      }
    }
  }

  return reachable;
}

/**
 * Parses ASL definition from string to object
 */
export function parseASLDefinition(definition: string | ASLDefinition): ASLDefinition {
  if (typeof definition === 'string') {
    try {
      return JSON.parse(definition);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error}`);
    }
  }
  return definition;
}
