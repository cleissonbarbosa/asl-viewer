import { createGraphLayout, createSimpleLayout } from "../layout";
import { ASLDefinition, StateNode, Connection } from "../../types";

describe("Layout Utils", () => {
  describe("createGraphLayout", () => {
    it("should create a basic graph layout with start and end nodes", () => {
      const definition: ASLDefinition = {
        StartAt: "HelloWorld",
        States: {
          HelloWorld: {
            Type: "Pass",
            Result: "Hello World!",
            End: true,
          },
        },
      };

      const layout = createGraphLayout(definition);

      expect(layout.nodes).toHaveLength(3); // start, HelloWorld, end
      expect(layout.edges).toHaveLength(2); // start->HelloWorld, HelloWorld->end
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);

      // Check artificial start node
      const startNode = layout.nodes.find((n) => n.id === "__start__");
      expect(startNode).toBeDefined();
      expect(startNode?.name).toBe("START");
      expect(startNode?.type).toBe("Pass");

      // Check artificial end node
      const endNode = layout.nodes.find((n) => n.id === "__end__");
      expect(endNode).toBeDefined();
      expect(endNode?.name).toBe("END");
      expect(endNode?.type).toBe("Pass");

      // Check HelloWorld node
      const helloWorldNode = layout.nodes.find((n) => n.id === "HelloWorld");
      expect(helloWorldNode).toBeDefined();
      expect(helloWorldNode?.name).toBe("HelloWorld");
      expect(helloWorldNode?.type).toBe("Pass");
      expect(helloWorldNode?.isStartState).toBe(true);
      expect(helloWorldNode?.isEndState).toBe(true);
    });

    it("should create connections between states in sequence", () => {
      const definition: ASLDefinition = {
        StartAt: "First",
        States: {
          First: {
            Type: "Pass",
            Next: "Second",
          },
          Second: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const layout = createGraphLayout(definition);

      expect(layout.nodes).toHaveLength(4); // start, First, Second, end
      expect(layout.edges).toHaveLength(3); // start->First, First->Second, Second->end

      // Check connections
      const edges = layout.edges;
      expect(
        edges.find((e) => e.from === "__start__" && e.to === "First"),
      ).toBeDefined();
      expect(
        edges.find((e) => e.from === "First" && e.to === "Second"),
      ).toBeDefined();
      expect(
        edges.find((e) => e.from === "Second" && e.to === "__end__"),
      ).toBeDefined();
    });

    it("should handle Choice states with multiple branches", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.value",
                NumericEquals: 1,
                Next: "FirstChoice",
              },
              {
                Variable: "$.value",
                NumericEquals: 2,
                Next: "SecondChoice",
              },
            ],
            Default: "DefaultChoice",
          },
          FirstChoice: {
            Type: "Pass",
            End: true,
          },
          SecondChoice: {
            Type: "Pass",
            End: true,
          },
          DefaultChoice: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const layout = createGraphLayout(definition);

      expect(layout.nodes).toHaveLength(6); // start, ChoiceState, FirstChoice, SecondChoice, DefaultChoice, end

      // Check choice connections
      const choiceEdges = layout.edges.filter((e) => e.from === "ChoiceState");
      expect(choiceEdges).toHaveLength(3); // Two choices + default

      const choiceEdge1 = choiceEdges.find((e) => e.to === "FirstChoice");
      expect(choiceEdge1?.type).toBe("choice");
      expect(choiceEdge1?.label).toBe("Choice 1");
      expect(choiceEdge1?.condition).toBe("$.value == 1");

      const choiceEdge2 = choiceEdges.find((e) => e.to === "SecondChoice");
      expect(choiceEdge2?.type).toBe("choice");
      expect(choiceEdge2?.label).toBe("Choice 2");
      expect(choiceEdge2?.condition).toBe("$.value == 2");

      const defaultEdge = choiceEdges.find((e) => e.to === "DefaultChoice");
      expect(defaultEdge?.type).toBe("default");
      expect(defaultEdge?.label).toBe("Default");
    });

    it("should handle Catch blocks for error handling", () => {
      const definition: ASLDefinition = {
        StartAt: "TaskWithCatch",
        States: {
          TaskWithCatch: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:MyFunction",
            Catch: [
              {
                ErrorEquals: ["States.TaskFailed"],
                Next: "ErrorHandler",
              },
            ],
            End: true,
          },
          ErrorHandler: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const layout = createGraphLayout(definition);

      const catchEdge = layout.edges.find(
        (e) => e.from === "TaskWithCatch" && e.to === "ErrorHandler",
      );
      expect(catchEdge).toBeDefined();
      expect(catchEdge?.type).toBe("error");
      expect(catchEdge?.label).toBe("Catch 1");
      expect(catchEdge?.condition).toBe("States.TaskFailed");
    });

    it("should handle multiple end states", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.result",
                StringEquals: "success",
                Next: "SuccessState",
              },
            ],
            Default: "FailState",
          },
          SuccessState: {
            Type: "Succeed",
          },
          FailState: {
            Type: "Fail",
            Error: "DefaultStateError",
            Cause: "No Matches!",
          },
        },
      };

      const layout = createGraphLayout(definition);

      // Both SuccessState and FailState should connect to artificial end
      const successToEnd = layout.edges.find(
        (e) => e.from === "SuccessState" && e.to === "__end__",
      );
      const failToEnd = layout.edges.find(
        (e) => e.from === "FailState" && e.to === "__end__",
      );

      expect(successToEnd).toBeDefined();
      expect(failToEnd).toBeDefined();
    });

    it("should set appropriate node sizes for different state types", () => {
      const definition: ASLDefinition = {
        StartAt: "TaskState",
        States: {
          TaskState: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:MyFunction",
            Next: "ChoiceState",
          },
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.value",
                NumericEquals: 1,
                Next: "ParallelState",
              },
            ],
            Default: "WaitState",
          },
          ParallelState: {
            Type: "Parallel",
            Branches: [],
            End: true,
          },
          WaitState: {
            Type: "Wait",
            Seconds: 5,
            End: true,
          },
        },
      };

      const layout = createGraphLayout(definition);

      const taskNode = layout.nodes.find((n) => n.id === "TaskState");
      const choiceNode = layout.nodes.find((n) => n.id === "ChoiceState");
      const parallelNode = layout.nodes.find((n) => n.id === "ParallelState");
      const waitNode = layout.nodes.find((n) => n.id === "WaitState");

      expect(taskNode?.size).toEqual({ width: 230, height: 40 });
      expect(choiceNode?.size).toEqual({ width: 240, height: 40 });
      expect(parallelNode?.size).toEqual({ width: 260, height: 40 });
      expect(waitNode?.size).toEqual({ width: 220, height: 40 });
    });

    it("should position nodes hierarchically", () => {
      const definition: ASLDefinition = {
        StartAt: "First",
        States: {
          First: {
            Type: "Pass",
            Next: "Second",
          },
          Second: {
            Type: "Pass",
            Next: "Third",
          },
          Third: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const layout = createGraphLayout(definition);

      // Nodes should be positioned with increasing Y coordinates
      const startNode = layout.nodes.find((n) => n.id === "__start__");
      const firstNode = layout.nodes.find((n) => n.id === "First");
      const secondNode = layout.nodes.find((n) => n.id === "Second");
      const thirdNode = layout.nodes.find((n) => n.id === "Third");
      const endNode = layout.nodes.find((n) => n.id === "__end__");

      expect(startNode?.position.y).toBeLessThan(firstNode?.position.y || 0);
      expect(firstNode?.position.y).toBeLessThan(secondNode?.position.y || 0);
      expect(secondNode?.position.y).toBeLessThan(thirdNode?.position.y || 0);
      expect(thirdNode?.position.y).toBeLessThan(endNode?.position.y || 0);
    });
  });

  describe("createSimpleLayout", () => {
    it("should create a simple vertical layout", () => {
      const definition: ASLDefinition = {
        StartAt: "HelloWorld",
        States: {
          HelloWorld: {
            Type: "Pass",
            Result: "Hello World!",
            End: true,
          },
        },
      };

      const layout = createSimpleLayout(definition);

      expect(layout.nodes).toHaveLength(3); // start, HelloWorld, end
      expect(layout.edges).toHaveLength(2); // start->HelloWorld, HelloWorld->end
      expect(layout.width).toBe(400);
      expect(layout.height).toBeGreaterThan(0);

      // Check that nodes are vertically aligned
      const startNode = layout.nodes.find((n) => n.id === "__start__");
      const helloWorldNode = layout.nodes.find((n) => n.id === "HelloWorld");
      const endNode = layout.nodes.find((n) => n.id === "__end__");

      expect(startNode?.position.y).toBeLessThan(
        helloWorldNode?.position.y || 0,
      );
      expect(helloWorldNode?.position.y).toBeLessThan(endNode?.position.y || 0);
    });

    it("should handle multiple states in sequence", () => {
      const definition: ASLDefinition = {
        StartAt: "First",
        States: {
          First: {
            Type: "Pass",
            Next: "Second",
          },
          Second: {
            Type: "Pass",
            Next: "Third",
          },
          Third: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const layout = createSimpleLayout(definition);

      expect(layout.nodes).toHaveLength(5); // start, First, Second, Third, end
      expect(layout.edges).toHaveLength(4); // connections between all nodes

      // Check vertical progression
      const nodes = layout.nodes.sort((a, b) => a.position.y - b.position.y);
      expect(nodes[0].id).toBe("__start__");
      expect(nodes[1].id).toBe("First");
      expect(nodes[2].id).toBe("Second");
      expect(nodes[3].id).toBe("Third");
      expect(nodes[4].id).toBe("__end__");
    });

    it("should adjust spacing for labeled edges", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.value",
                NumericEquals: 1,
                Next: "NextState",
              },
            ],
            Default: "DefaultState",
          },
          NextState: {
            Type: "Pass",
            End: true,
          },
          DefaultState: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const layout = createSimpleLayout(definition);

      // Choice state should have labeled edges, so spacing should be increased
      const choiceNode = layout.nodes.find((n) => n.id === "ChoiceState");
      const nextNode = layout.nodes.find((n) => n.id === "NextState");

      expect(choiceNode).toBeDefined();
      expect(nextNode).toBeDefined();

      // The Y difference should be greater than base spacing due to labeled edges
      const yDifference =
        (nextNode?.position.y || 0) - (choiceNode?.position.y || 0);
      expect(yDifference).toBeGreaterThan(150); // base spacing + labeled edge spacing
    });

    it("should center nodes horizontally", () => {
      const definition: ASLDefinition = {
        StartAt: "TestState",
        States: {
          TestState: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const layout = createSimpleLayout(definition);

      const testNode = layout.nodes.find((n) => n.id === "TestState");
      expect(testNode).toBeDefined();

      // Node should be centered around x=200
      const expectedX = 200 - (testNode?.size.width || 0) / 2;
      expect(testNode?.position.x).toBe(expectedX);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty workflow gracefully", () => {
      const definition: ASLDefinition = {
        StartAt: "NonExistent",
        States: {},
      };

      // Should not throw an error
      expect(() => createGraphLayout(definition)).not.toThrow();
      expect(() => createSimpleLayout(definition)).not.toThrow();

      const layout = createGraphLayout(definition);

      expect(layout.nodes).toHaveLength(2); // Only start and end nodes
      expect(layout.edges).toHaveLength(1); // Only start to NonExistent (which doesn't exist)
    });

    it("should handle circular workflows", () => {
      const definition: ASLDefinition = {
        StartAt: "StateA",
        States: {
          StateA: {
            Type: "Pass",
            Next: "StateB",
          },
          StateB: {
            Type: "Pass",
            Next: "StateA", // Circular reference
          },
        },
      };

      // Should not throw an error
      expect(() => createGraphLayout(definition)).not.toThrow();
      expect(() => createSimpleLayout(definition)).not.toThrow();
    });

    it("should handle workflows with unreachable states", () => {
      const definition: ASLDefinition = {
        StartAt: "StateA",
        States: {
          StateA: {
            Type: "Pass",
            End: true,
          },
          UnreachableState: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const layout = createGraphLayout(definition);

      // Both states should be included in the layout
      expect(layout.nodes.find((n) => n.id === "StateA")).toBeDefined();
      expect(
        layout.nodes.find((n) => n.id === "UnreachableState"),
      ).toBeDefined();
    });
  });

  describe("Choice condition formatting", () => {
    it("should format string comparison conditions correctly", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.type",
                StringEquals: "success",
                Next: "SuccessState",
              },
              {
                Variable: "$.type",
                StringLessThan: "z",
                Next: "LessThanState",
              },
              {
                Variable: "$.type",
                StringGreaterThan: "a",
                Next: "GreaterThanState",
              },
            ],
            Default: "DefaultState",
          },
          SuccessState: { Type: "Pass", End: true },
          LessThanState: { Type: "Pass", End: true },
          GreaterThanState: { Type: "Pass", End: true },
          DefaultState: { Type: "Pass", End: true },
        },
      };

      const layout = createGraphLayout(definition);

      const choiceEdges = layout.edges.filter(
        (e) => e.from === "ChoiceState" && e.type === "choice",
      );

      expect(choiceEdges.find((e) => e.to === "SuccessState")?.condition).toBe(
        '$.type == "success"',
      );
      expect(choiceEdges.find((e) => e.to === "LessThanState")?.condition).toBe(
        '$.type < "z"',
      );
      expect(
        choiceEdges.find((e) => e.to === "GreaterThanState")?.condition,
      ).toBe('$.type > "a"');
    });

    it("should format numeric comparison conditions correctly", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.count",
                NumericEquals: 42,
                Next: "EqualsState",
              },
              {
                Variable: "$.count",
                NumericLessThan: 100,
                Next: "LessThanState",
              },
              {
                Variable: "$.count",
                NumericGreaterThan: 0,
                Next: "GreaterThanState",
              },
            ],
            Default: "DefaultState",
          },
          EqualsState: { Type: "Pass", End: true },
          LessThanState: { Type: "Pass", End: true },
          GreaterThanState: { Type: "Pass", End: true },
          DefaultState: { Type: "Pass", End: true },
        },
      };

      const layout = createGraphLayout(definition);

      const choiceEdges = layout.edges.filter(
        (e) => e.from === "ChoiceState" && e.type === "choice",
      );

      expect(choiceEdges.find((e) => e.to === "EqualsState")?.condition).toBe(
        "$.count == 42",
      );
      expect(choiceEdges.find((e) => e.to === "LessThanState")?.condition).toBe(
        "$.count < 100",
      );
      expect(
        choiceEdges.find((e) => e.to === "GreaterThanState")?.condition,
      ).toBe("$.count > 0");
    });

    it("should format boolean conditions correctly", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.isActive",
                BooleanEquals: true,
                Next: "ActiveState",
              },
            ],
            Default: "InactiveState",
          },
          ActiveState: { Type: "Pass", End: true },
          InactiveState: { Type: "Pass", End: true },
        },
      };

      const layout = createGraphLayout(definition);

      const choiceEdge = layout.edges.find(
        (e) => e.from === "ChoiceState" && e.to === "ActiveState",
      );
      expect(choiceEdge?.condition).toBe("$.isActive == true");
    });
  });
});
