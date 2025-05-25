/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateASLDefinition } from '../validation';
import { ASLDefinition } from '../../types';

describe('Performance tests for validateASLDefinition', () => {
  // Helper function to create a large workflow for performance testing
  function createLargeWorkflow(numStates: number): ASLDefinition {
    const states: Record<string, any> = {};
    
    // Create a chain of states
    for (let i = 0; i < numStates; i++) {
      const stateName = `State${i}`;
      const isLast = i === numStates - 1;
      
      states[stateName] = {
        Type: 'Task',
        Resource: `arn:aws:lambda:us-east-1:123456789012:function:Function${i}`,
        ...(isLast ? { End: true } : { Next: `State${i + 1}` })
      };
    }

    return {
      Comment: `Large workflow with ${numStates} states`,
      StartAt: 'State0',
      States: states
    };
  }

  function createComplexWorkflow(numStates: number): ASLDefinition {
    const states: Record<string, any> = {};
    
    // Create a workflow with choice states that branch and merge
    states['Start'] = {
      Type: 'Choice',
      Choices: Array.from({ length: Math.min(numStates / 2, 10) }, (_, i) => ({
        Variable: `$.branch`,
        NumericEquals: i,
        Next: `Branch${i}`
      })),
      Default: 'Branch0'
    };
    
    // Create branch states that all lead to a common end state
    for (let i = 0; i < Math.min(numStates / 2, 10); i++) {
      states[`Branch${i}`] = {
        Type: 'Task',
        Resource: `arn:aws:lambda:us-east-1:123456789012:function:Branch${i}`,
        Next: 'CommonEnd'
      };
    }
    
    states['CommonEnd'] = {
      Type: 'Pass',
      Result: 'Workflow completed',
      End: true
    };
    
    // Add additional linear states to reach the target number
    const remainingStates = numStates - Object.keys(states).length;
    for (let i = 0; i < remainingStates; i++) {
      const stateName = `Additional${i}`;
      const prevState = i === 0 ? 'CommonEnd' : `Additional${i - 1}`;
      
      // Update previous state to point to this one
      if (i === 0) {
        states['CommonEnd'].Next = stateName;
        delete states['CommonEnd'].End;
      } else {
        states[`Additional${i - 1}`].Next = stateName;
      }
      
      states[stateName] = {
        Type: 'Task',
        Resource: `arn:aws:lambda:us-east-1:123456789012:function:Additional${i}`,
        ...(i === remainingStates - 1 ? { End: true } : {})
      };
    }

    return {
      Comment: `Complex workflow with ${numStates} states including choice branches`,
      StartAt: 'Start',
      States: states
    };
  }

  it('should validate large linear workflow efficiently', () => {
    const largeWorkflow = createLargeWorkflow(1000);
    
    const start = performance.now();
    const errors = validateASLDefinition(largeWorkflow);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`Validated 1000-state linear workflow in ${duration.toFixed(2)}ms`);
    
    expect(errors).toHaveLength(0);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should validate complex choice workflow efficiently', () => {
    const complexWorkflow = createComplexWorkflow(100); // 100 states with choice branches
    
    const start = performance.now();
    const errors = validateASLDefinition(complexWorkflow);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`Validated complex workflow with 100 states (including choice branches) in ${duration.toFixed(2)}ms`);
    
    expect(errors).toHaveLength(0);
    expect(duration).toBeLessThan(200); // Should complete in under 200ms
  });

  it('should handle workflow with unreachable states efficiently', () => {
    const workflowWithUnreachable = createLargeWorkflow(500);
    
    // Add some unreachable states
    for (let i = 0; i < 100; i++) {
      workflowWithUnreachable.States[`Unreachable${i}`] = {
        Type: 'Pass',
        Result: `Unreachable state ${i}`,
        End: true
      };
    }
    
    const start = performance.now();
    const errors = validateASLDefinition(workflowWithUnreachable);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`Validated workflow with 500 reachable + 100 unreachable states in ${duration.toFixed(2)}ms`);
    
    // Should find 100 unreachable state warnings
    const unreachableErrors = errors.filter(e => e.message.includes('unreachable'));
    expect(unreachableErrors).toHaveLength(100);
    expect(duration).toBeLessThan(150); // Should complete in under 150ms
  });

  it('should validate multiple workflows in sequence efficiently', () => {
    const workflows = [
      createLargeWorkflow(200),
      createComplexWorkflow(150),
      createLargeWorkflow(300),
      createComplexWorkflow(100)
    ];
    
    const start = performance.now();
    
    const allErrors = workflows.map(workflow => validateASLDefinition(workflow));
    
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Validated 4 different workflows in sequence in ${duration.toFixed(2)}ms`);
    
    // All workflows should be valid
    allErrors.forEach(errors => {
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });
    
    expect(duration).toBeLessThan(300); // Should complete in under 300ms
  });
});
