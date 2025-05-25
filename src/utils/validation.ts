/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASLDefinition, StateDefinition, ValidationError } from '../types';

/**
 * Validates an ASL definition for syntax and semantic errors
 */
export function validateASLDefinition(definition: ASLDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!definition.StartAt) {
    errors.push({
      message: 'StartAt field is required',
      path: 'StartAt',
      severity: 'error'
    });
  }

  if (!definition.States || Object.keys(definition.States).length === 0) {
    errors.push({
      message: 'States field is required and must contain at least one state',
      path: 'States',
      severity: 'error'
    });
  }

  // Validate StartAt references an existing state
  if (definition.StartAt && definition.States && !definition.States[definition.StartAt]) {
    errors.push({
      message: `StartAt references non-existent state: ${definition.StartAt}`,
      path: 'StartAt',
      severity: 'error'
    });
  }

  // Validate each state
  if (definition.States) {
    Object.entries(definition.States).forEach(([stateName, state]) => {
      errors.push(...validateState(stateName, state, definition.States!));
    });
  }

  // Check for unreachable states
  const reachableStates = findReachableStates(definition);
  if (definition.States) {
    Object.keys(definition.States).forEach(stateName => {
      if (!reachableStates.has(stateName)) {
        errors.push({
          message: `State "${stateName}" is unreachable`,
          path: `States.${stateName}`,
          severity: 'warning'
        });
      }
    });
  }

  return errors;
}

function validateState(
  stateName: string, 
  state: StateDefinition, 
  allStates: Record<string, StateDefinition>
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

  // Validate state type-specific requirements
  switch (state.Type) {
    case 'Pass':
      // Pass states can have Result but not Resource
      if (state.Resource) {
        errors.push({
          message: 'Pass states cannot have Resource field',
          path: `${basePath}.Resource`,
          severity: 'error'
        });
      }
      break;

    case 'Task':
      // Task states must have Resource
      if (!state.Resource) {
        errors.push({
          message: 'Task states must have Resource field',
          path: `${basePath}.Resource`,
          severity: 'error'
        });
      }
      break;

    case 'Choice':
      // Choice states must have Choices array and cannot have End or Next
      if (!state.Choices || !Array.isArray(state.Choices) || state.Choices.length === 0) {
        errors.push({
          message: 'Choice states must have non-empty Choices array',
          path: `${basePath}.Choices`,
          severity: 'error'
        });
      }
      if (state.End) {
        errors.push({
          message: 'Choice states cannot have End field',
          path: `${basePath}.End`,
          severity: 'error'
        });
      }
      if (state.Next) {
        errors.push({
          message: 'Choice states cannot have Next field',
          path: `${basePath}.Next`,
          severity: 'error'
        });
      }
      break;

    case 'Wait':
      // Wait states must have exactly one time specification
      const timeFields = ['Seconds', 'Timestamp', 'SecondsPath', 'TimestampPath'];
      const presentTimeFields = timeFields.filter(field => state[field as keyof StateDefinition] !== undefined);
      
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
      if (state.Next) {
        errors.push({
          message: 'Fail states cannot have Next field',
          path: `${basePath}.Next`,
          severity: 'error'
        });
      }
      break;

    case 'Succeed':
      // Succeed states cannot have Next and automatically end
      if (state.Next) {
        errors.push({
          message: 'Succeed states cannot have Next field',
          path: `${basePath}.Next`,
          severity: 'error'
        });
      }
      break;
  }

  // Validate Next references
  if (state.Next && !allStates[state.Next]) {
    errors.push({
      message: `Next references non-existent state: ${state.Next}`,
      path: `${basePath}.Next`,
      severity: 'error'
    });
  }

  // Validate Choice references
  if (state.Choices) {
    state.Choices.forEach((choice, index) => {
      if (choice.Next && !allStates[choice.Next]) {
        errors.push({
          message: `Choice rule references non-existent state: ${choice.Next}`,
          path: `${basePath}.Choices[${index}].Next`,
          severity: 'error'
        });
      }
    });
  }

  // Validate Default reference for Choice states
  if (state.Default && !allStates[state.Default]) {
    errors.push({
      message: `Default references non-existent state: ${state.Default}`,
      path: `${basePath}.Default`,
      severity: 'error'
    });
  }

  // Validate Catch references
  if (state.Catch) {
    state.Catch.forEach((catchDef, index) => {
      if (!allStates[catchDef.Next]) {
        errors.push({
          message: `Catch references non-existent state: ${catchDef.Next}`,
          path: `${basePath}.Catch[${index}].Next`,
          severity: 'error'
        });
      }
    });
  }

  return errors;
}

function findReachableStates(definition: ASLDefinition): Set<string> {
  const reachable = new Set<string>();
  const toVisit = [definition.StartAt];

  while (toVisit.length > 0) {
    const current = toVisit.pop()!;
    if (reachable.has(current) || !definition.States[current]) {
      continue;
    }

    reachable.add(current);
    const state = definition.States[current];

    // Add next states to visit
    if (state.Next) {
      toVisit.push(state.Next);
    }

    if (state.Choices) {
      state.Choices.forEach(choice => {
        toVisit.push(choice.Next);
      });
    }

    if (state.Default) {
      toVisit.push(state.Default);
    }

    if (state.Catch) {
      state.Catch.forEach(catchDef => {
        toVisit.push(catchDef.Next);
      });
    }

    // Handle parallel branches
    if (state.Branches) {
      state.Branches.forEach(branch => {
        const branchReachable = findReachableStates(branch);
        branchReachable.forEach(stateName => reachable.add(stateName));
      });
    }

    // Handle map iterator
    if (state.Iterator) {
      const iteratorReachable = findReachableStates(state.Iterator);
      iteratorReachable.forEach(stateName => reachable.add(stateName));
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
