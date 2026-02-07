import {
  getWorkflowStatistics,
  detectCycles,
  WorkflowStatistics,
} from "../statistics";
import { ASLDefinition } from "../../types";

describe("getWorkflowStatistics", () => {
  it("should return correct stats for a simple workflow", () => {
    const definition: ASLDefinition = {
      StartAt: "Hello",
      States: {
        Hello: {
          Type: "Pass",
          Result: "Hello World!",
          End: true,
        },
      },
    };

    const stats = getWorkflowStatistics(definition);

    expect(stats.totalStates).toBe(1);
    expect(stats.stateTypeCounts.Pass).toBe(1);
    expect(stats.stateTypeCounts.Task).toBe(0);
    expect(stats.maxDepth).toBe(1);
    expect(stats.totalConnections).toBe(0);
    expect(stats.errorHandlingCount).toBe(0);
    expect(stats.parallelBranchCount).toBe(0);
    expect(stats.hasCycles).toBe(false);
    expect(stats.cyclicPaths).toHaveLength(0);
    expect(stats.terminalStates).toEqual(["Hello"]);
    expect(stats.statesWithErrorHandling).toHaveLength(0);
    expect(stats.complexityScore).toBeGreaterThanOrEqual(1);
    expect(stats.complexityScore).toBeLessThanOrEqual(10);
  });

  it("should count state types correctly", () => {
    const definition: ASLDefinition = {
      StartAt: "TaskA",
      States: {
        TaskA: {
          Type: "Task",
          Resource: "arn:aws:lambda:us-east-1:123456:function:A",
          Next: "Check",
        },
        Check: {
          Type: "Choice",
          Choices: [
            { Variable: "$.ok", BooleanEquals: true, Next: "WaitStep" },
          ],
          Default: "FailStep",
        },
        WaitStep: {
          Type: "Wait",
          Seconds: 5,
          Next: "Success",
        },
        Success: {
          Type: "Succeed",
        },
        FailStep: {
          Type: "Fail",
          Cause: "Something went wrong",
        },
      },
    };

    const stats = getWorkflowStatistics(definition);

    expect(stats.totalStates).toBe(5);
    expect(stats.stateTypeCounts.Task).toBe(1);
    expect(stats.stateTypeCounts.Choice).toBe(1);
    expect(stats.stateTypeCounts.Wait).toBe(1);
    expect(stats.stateTypeCounts.Succeed).toBe(1);
    expect(stats.stateTypeCounts.Fail).toBe(1);
    expect(stats.terminalStates).toContain("Success");
    expect(stats.terminalStates).toContain("FailStep");
  });

  it("should count connections correctly", () => {
    const definition: ASLDefinition = {
      StartAt: "A",
      States: {
        A: {
          Type: "Task",
          Resource: "arn:aws:lambda:us-east-1:123456:function:A",
          Next: "B",
        },
        B: {
          Type: "Choice",
          Choices: [
            { Variable: "$.x", NumericEquals: 1, Next: "C" },
            { Variable: "$.x", NumericEquals: 2, Next: "D" },
          ],
          Default: "C",
        },
        C: { Type: "Pass", End: true },
        D: { Type: "Pass", End: true },
      },
    };

    const stats = getWorkflowStatistics(definition);

    // A->B (1), B->C via choice (1), B->D via choice (1), B->C via default (1) = 4
    expect(stats.totalConnections).toBe(4);
  });

  it("should count error handling correctly", () => {
    const definition: ASLDefinition = {
      StartAt: "A",
      States: {
        A: {
          Type: "Task",
          Resource: "arn:aws:lambda:us-east-1:123456:function:A",
          Retry: [
            { ErrorEquals: ["States.TaskFailed"], MaxAttempts: 3 },
            { ErrorEquals: ["States.Timeout"], MaxAttempts: 2 },
          ],
          Catch: [{ ErrorEquals: ["States.ALL"], Next: "ErrorHandler" }],
          Next: "Done",
        },
        ErrorHandler: { Type: "Fail", Cause: "Failed" },
        Done: { Type: "Succeed" },
      },
    };

    const stats = getWorkflowStatistics(definition);

    expect(stats.errorHandlingCount).toBe(3); // 2 Retry + 1 Catch
    expect(stats.statesWithErrorHandling).toContain("A");
    expect(stats.statesWithErrorHandling).toHaveLength(1);
  });

  it("should count parallel branches correctly", () => {
    const definition: ASLDefinition = {
      StartAt: "ParallelStep",
      States: {
        ParallelStep: {
          Type: "Parallel",
          Branches: [
            {
              StartAt: "B1",
              States: { B1: { Type: "Pass", End: true } },
            },
            {
              StartAt: "B2",
              States: { B2: { Type: "Pass", End: true } },
            },
            {
              StartAt: "B3",
              States: { B3: { Type: "Pass", End: true } },
            },
          ],
          End: true,
        },
      },
    };

    const stats = getWorkflowStatistics(definition);

    expect(stats.parallelBranchCount).toBe(3);
  });

  it("should calculate max depth correctly", () => {
    const definition: ASLDefinition = {
      StartAt: "A",
      States: {
        A: { Type: "Pass", Next: "B" },
        B: { Type: "Pass", Next: "C" },
        C: { Type: "Pass", Next: "D" },
        D: { Type: "Pass", Next: "E" },
        E: { Type: "Pass", End: true },
      },
    };

    const stats = getWorkflowStatistics(definition);

    expect(stats.maxDepth).toBe(5);
  });

  it("should return complexity score between 1 and 10", () => {
    const simpleDefinition: ASLDefinition = {
      StartAt: "A",
      States: { A: { Type: "Pass", End: true } },
    };

    const complexDefinition: ASLDefinition = {
      StartAt: "A",
      States: {
        A: {
          Type: "Task",
          Resource: "arn:aws:lambda:us-east-1:123456:function:A",
          Retry: [{ ErrorEquals: ["States.ALL"], MaxAttempts: 3 }],
          Catch: [{ ErrorEquals: ["States.ALL"], Next: "Error" }],
          Next: "B",
        },
        B: {
          Type: "Choice",
          Choices: [
            { Variable: "$.x", NumericEquals: 1, Next: "C" },
            { Variable: "$.x", NumericEquals: 2, Next: "D" },
          ],
          Default: "Error",
        },
        C: {
          Type: "Parallel",
          Branches: [
            {
              StartAt: "P1",
              States: {
                P1: {
                  Type: "Task",
                  Resource: "arn:aws:lambda:us-east-1:123456:function:P1",
                  End: true,
                },
              },
            },
            {
              StartAt: "P2",
              States: {
                P2: {
                  Type: "Task",
                  Resource: "arn:aws:lambda:us-east-1:123456:function:P2",
                  End: true,
                },
              },
            },
          ],
          Next: "Done",
        },
        D: { Type: "Wait", Seconds: 10, Next: "Done" },
        Done: { Type: "Succeed" },
        Error: { Type: "Fail", Cause: "Error" },
      },
    };

    const simpleStats = getWorkflowStatistics(simpleDefinition);
    const complexStats = getWorkflowStatistics(complexDefinition);

    expect(simpleStats.complexityScore).toBeGreaterThanOrEqual(1);
    expect(simpleStats.complexityScore).toBeLessThanOrEqual(10);
    expect(complexStats.complexityScore).toBeGreaterThanOrEqual(1);
    expect(complexStats.complexityScore).toBeLessThanOrEqual(10);
    expect(complexStats.complexityScore).toBeGreaterThan(
      simpleStats.complexityScore,
    );
  });

  it("should handle empty States", () => {
    const definition: ASLDefinition = {
      StartAt: "A",
      States: {},
    };

    const stats = getWorkflowStatistics(definition);

    expect(stats.totalStates).toBe(0);
    expect(stats.maxDepth).toBe(0);
    expect(stats.totalConnections).toBe(0);
  });
});

describe("detectCycles", () => {
  it("should detect a simple cycle", () => {
    const definition: ASLDefinition = {
      StartAt: "A",
      States: {
        A: { Type: "Pass", Next: "B" },
        B: { Type: "Pass", Next: "A" },
      },
    };

    const result = detectCycles(definition);

    expect(result.hasCycles).toBe(true);
    expect(result.cyclicPaths.length).toBeGreaterThan(0);
    // Cycle should include A -> B -> A
    const cycleFlat = result.cyclicPaths.flat();
    expect(cycleFlat).toContain("A");
    expect(cycleFlat).toContain("B");
  });

  it("should detect a cycle through Choice default", () => {
    const definition: ASLDefinition = {
      StartAt: "Check",
      States: {
        Check: {
          Type: "Choice",
          Choices: [{ Variable: "$.done", BooleanEquals: true, Next: "Done" }],
          Default: "Process",
        },
        Process: {
          Type: "Task",
          Resource: "arn:aws:lambda:us-east-1:123456:function:Proc",
          Next: "Check",
        },
        Done: { Type: "Succeed" },
      },
    };

    const result = detectCycles(definition);

    expect(result.hasCycles).toBe(true);
    expect(result.cyclicPaths.length).toBeGreaterThan(0);
  });

  it("should return no cycles for a DAG workflow", () => {
    const definition: ASLDefinition = {
      StartAt: "A",
      States: {
        A: { Type: "Pass", Next: "B" },
        B: { Type: "Pass", Next: "C" },
        C: { Type: "Pass", End: true },
      },
    };

    const result = detectCycles(definition);

    expect(result.hasCycles).toBe(false);
    expect(result.cyclicPaths).toHaveLength(0);
  });

  it("should handle empty definition", () => {
    const definition: ASLDefinition = {
      StartAt: "A",
      States: {},
    };

    const result = detectCycles(definition);

    expect(result.hasCycles).toBe(false);
    expect(result.cyclicPaths).toHaveLength(0);
  });

  it("should detect multiple cycles", () => {
    const definition: ASLDefinition = {
      StartAt: "A",
      States: {
        A: {
          Type: "Choice",
          Choices: [
            { Variable: "$.x", NumericEquals: 1, Next: "B" },
            { Variable: "$.x", NumericEquals: 2, Next: "D" },
          ],
          Default: "End",
        },
        B: { Type: "Pass", Next: "C" },
        C: { Type: "Pass", Next: "A" },
        D: { Type: "Pass", Next: "E" },
        E: { Type: "Pass", Next: "D" },
        End: { Type: "Succeed" },
      },
    };

    const result = detectCycles(definition);

    expect(result.hasCycles).toBe(true);
    expect(result.cyclicPaths.length).toBeGreaterThanOrEqual(1);
  });
});
