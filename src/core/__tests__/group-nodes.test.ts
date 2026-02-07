import {
  createParallelChildNodes,
  createMapChildNodes,
  positionChildNodes,
} from "../layout/group-nodes";
import { ASLDefinition, StateNode } from "../../types";

describe("createParallelChildNodes", () => {
  it("should create child nodes for each branch", () => {
    const branches: ASLDefinition[] = [
      {
        StartAt: "TaskA",
        States: {
          TaskA: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:123456:function:A",
            End: true,
          },
        },
      },
      {
        StartAt: "TaskB",
        States: {
          TaskB: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:123456:function:B",
            End: true,
          },
        },
      },
    ];

    const children = createParallelChildNodes("parent", branches);

    expect(children).toHaveLength(2);
    expect(children[0].id).toBe("parent_branch0_TaskA");
    expect(children[0].branchIndex).toBe(0);
    expect(children[0].parentId).toBe("parent");
    expect(children[1].id).toBe("parent_branch1_TaskB");
    expect(children[1].branchIndex).toBe(1);
  });

  it("should create connections within branches", () => {
    const branches: ASLDefinition[] = [
      {
        StartAt: "Step1",
        States: {
          Step1: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:123456:function:S1",
            Next: "Step2",
          },
          Step2: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:123456:function:S2",
            End: true,
          },
        },
      },
    ];

    const children = createParallelChildNodes("parent", branches);

    const step1 = children.find((c) => c.name === "Step1");
    expect(step1).toBeDefined();
    expect(step1!.connections).toHaveLength(1);
    expect(step1!.connections[0].from).toBe("parent_branch0_Step1");
    expect(step1!.connections[0].to).toBe("parent_branch0_Step2");
  });

  it("should mark start and end states correctly", () => {
    const branches: ASLDefinition[] = [
      {
        StartAt: "Start",
        States: {
          Start: { Type: "Pass", Next: "End" },
          End: { Type: "Succeed" },
        },
      },
    ];

    const children = createParallelChildNodes("p", branches);

    const startNode = children.find((c) => c.name === "Start");
    const endNode = children.find((c) => c.name === "End");

    expect(startNode!.isStartState).toBe(true);
    expect(endNode!.isEndState).toBe(true);
  });
});

describe("createMapChildNodes", () => {
  it("should create child nodes for iterator states", () => {
    const iterator: ASLDefinition = {
      StartAt: "ProcessItem",
      States: {
        ProcessItem: {
          Type: "Task",
          Resource: "arn:aws:lambda:us-east-1:123456:function:Process",
          Next: "ValidateItem",
        },
        ValidateItem: {
          Type: "Task",
          Resource: "arn:aws:lambda:us-east-1:123456:function:Validate",
          End: true,
        },
      },
    };

    const children = createMapChildNodes("mapParent", iterator);

    expect(children).toHaveLength(2);
    expect(children[0].id).toBe("mapParent_iterator_ProcessItem");
    expect(children[0].parentId).toBe("mapParent");
    expect(children[0].branchIndex).toBe(0);
  });

  it("should create connections within the iterator", () => {
    const iterator: ASLDefinition = {
      StartAt: "A",
      States: {
        A: { Type: "Pass", Next: "B" },
        B: { Type: "Pass", End: true },
      },
    };

    const children = createMapChildNodes("map", iterator);

    const nodeA = children.find((c) => c.name === "A");
    expect(nodeA!.connections).toHaveLength(1);
    expect(nodeA!.connections[0].to).toBe("map_iterator_B");
  });
});

describe("positionChildNodes", () => {
  const createParentNode = (type: string = "Parallel"): StateNode => ({
    id: "parent",
    name: "parent",
    type: type as any,
    definition: { Type: type as any },
    position: { x: 100, y: 100 },
    size: { width: 260, height: 60 },
    connections: [],
    isStartState: false,
    isEndState: false,
    isGroup: true,
  });

  const createChild = (id: string, branchIndex: number = 0): StateNode => ({
    id,
    name: id,
    type: "Task",
    definition: { Type: "Task", Resource: "arn:..." },
    position: { x: 0, y: 0 },
    size: { width: 230, height: 60 },
    connections: [],
    isStartState: false,
    isEndState: false,
    parentId: "parent",
    branchIndex,
  });

  it("should position Parallel children in separate branches", () => {
    const parent = createParentNode("Parallel");
    const children = [createChild("A", 0), createChild("B", 1)];

    positionChildNodes(parent, children, 80);

    // Children should be at different x positions (different branches)
    expect(children[0].position.x).not.toBe(children[1].position.x);
    // Both should be below the parent
    expect(children[0].position.y).toBeGreaterThan(parent.position.y);
    expect(children[1].position.y).toBeGreaterThan(parent.position.y);
  });

  it("should position Map children vertically", () => {
    const parent = createParentNode("Map");
    const children = [createChild("A"), createChild("B"), createChild("C")];

    positionChildNodes(parent, children, 80);

    // Children should be at the same x position
    const xPositions = children.map((c) => c.position.x);
    expect(new Set(xPositions).size).toBe(1);

    // Children should be stacked vertically with increasing y
    for (let i = 1; i < children.length; i++) {
      expect(children[i].position.y).toBeGreaterThan(
        children[i - 1].position.y,
      );
    }
  });

  it("should handle empty children array", () => {
    const parent = createParentNode();
    const children: StateNode[] = [];

    // Should not throw
    expect(() => positionChildNodes(parent, children, 80)).not.toThrow();
  });
});
