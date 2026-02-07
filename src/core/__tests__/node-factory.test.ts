import {
  createStateNode,
  createGroupNode,
  createArtificialNodes,
} from "../layout/node-factory";
import { StateDefinition, StateNode } from "../../types";

describe("createStateNode", () => {
  it("should create a basic state node", () => {
    const state: StateDefinition = {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456:function:MyFunc",
      Next: "Done",
    };

    const node = createStateNode("MyTask", state, "MyTask");

    expect(node.id).toBe("MyTask");
    expect(node.name).toBe("MyTask");
    expect(node.type).toBe("Task");
    expect(node.definition).toBe(state);
    expect(node.isStartState).toBe(true);
    expect(node.isEndState).toBe(false);
    expect(node.connections).toEqual([]);
    expect(node.position).toEqual({ x: 0, y: 0 });
    expect(node.size.width).toBeGreaterThan(0);
    expect(node.size.height).toBeGreaterThan(0);
  });

  it("should mark as start state when matching StartAt", () => {
    const state: StateDefinition = { Type: "Pass", Next: "B" };
    const node = createStateNode("A", state, "A");
    expect(node.isStartState).toBe(true);
  });

  it("should not mark as start state when not matching StartAt", () => {
    const state: StateDefinition = { Type: "Pass", Next: "B" };
    const node = createStateNode("B", state, "A");
    expect(node.isStartState).toBe(false);
  });

  it("should mark as end state for End: true", () => {
    const state: StateDefinition = {
      Type: "Task",
      Resource: "arn:...",
      End: true,
    };
    const node = createStateNode("T", state, "A");
    expect(node.isEndState).toBe(true);
  });

  it("should mark as end state for Succeed type", () => {
    const state: StateDefinition = { Type: "Succeed" };
    const node = createStateNode("Done", state, "A");
    expect(node.isEndState).toBe(true);
  });

  it("should mark as end state for Fail type", () => {
    const state: StateDefinition = { Type: "Fail", Cause: "Error" };
    const node = createStateNode("Error", state, "A");
    expect(node.isEndState).toBe(true);
  });

  it("should not mark as end state for non-terminal states", () => {
    const state: StateDefinition = { Type: "Pass", Next: "B" };
    const node = createStateNode("A", state, "A");
    expect(node.isEndState).toBe(false);
  });
});

describe("createGroupNode", () => {
  const createChild = (id: string): StateNode => ({
    id,
    name: id,
    type: "Task",
    definition: { Type: "Task", Resource: "arn:..." },
    position: { x: 0, y: 0 },
    size: { width: 230, height: 60 },
    connections: [],
    isStartState: false,
    isEndState: false,
  });

  it("should create a group node with children", () => {
    const state: StateDefinition = {
      Type: "Parallel",
      Branches: [{ StartAt: "A", States: { A: { Type: "Pass", End: true } } }],
    };
    const children = [createChild("A")];

    const node = createGroupNode(
      "ParallelGroup",
      state,
      "ParallelGroup",
      children,
    );

    expect(node.isGroup).toBe(true);
    expect(node.children).toEqual(children);
    expect(node.isExpanded).toBe(false);
    expect(node.groupBounds).toBeDefined();
    expect(node.groupBounds!.width).toBeGreaterThan(0);
    expect(node.groupBounds!.height).toBeGreaterThan(0);
  });

  it("should start collapsed", () => {
    const state: StateDefinition = {
      Type: "Map",
      Iterator: {
        StartAt: "Process",
        States: { Process: { Type: "Pass", End: true } },
      },
    };
    const children = [createChild("Process")];

    const node = createGroupNode("MapGroup", state, "Start", children);

    expect(node.isExpanded).toBe(false);
    // Collapsed size should be the same as regular node
    expect(node.size.width).toBeLessThanOrEqual(260);
  });
});

describe("createArtificialNodes", () => {
  it("should create start and end nodes", () => {
    const { start, end } = createArtificialNodes();

    expect(start.id).toBe("__start__");
    expect(start.name).toBe("START");
    expect(start.size).toEqual({ width: 80, height: 80 });

    expect(end.id).toBe("__end__");
    expect(end.name).toBe("END");
    expect(end.size).toEqual({ width: 80, height: 80 });
  });

  it("should create nodes with Pass type placeholder", () => {
    const { start, end } = createArtificialNodes();

    expect(start.type).toBe("Pass");
    expect(end.type).toBe("Pass");
  });

  it("should not mark artificial nodes as start or end states", () => {
    const { start, end } = createArtificialNodes();

    expect(start.isStartState).toBe(false);
    expect(start.isEndState).toBe(false);
    expect(end.isStartState).toBe(false);
    expect(end.isEndState).toBe(false);
  });
});
