import { getStateSize, calculateGroupBounds } from "../layout/sizing";
import { StateNode } from "../../types";

describe("getStateSize", () => {
  it("should return correct size for Task states", () => {
    const size = getStateSize("Task");
    expect(size).toEqual({ width: 230, height: 60 });
  });

  it("should return correct size for Choice states", () => {
    const size = getStateSize("Choice");
    expect(size).toEqual({ width: 240, height: 60 });
  });

  it("should return correct size for Parallel states", () => {
    const size = getStateSize("Parallel");
    expect(size).toEqual({ width: 260, height: 60 });
  });

  it("should return correct size for Map states", () => {
    const size = getStateSize("Map");
    expect(size).toEqual({ width: 260, height: 60 });
  });

  it("should return correct size for Wait states", () => {
    const size = getStateSize("Wait");
    expect(size).toEqual({ width: 220, height: 60 });
  });

  it("should return default size for Pass states", () => {
    const size = getStateSize("Pass");
    expect(size).toEqual({ width: 220, height: 60 });
  });

  it("should return default size for Succeed states", () => {
    const size = getStateSize("Succeed");
    expect(size).toEqual({ width: 220, height: 60 });
  });

  it("should return default size for Fail states", () => {
    const size = getStateSize("Fail");
    expect(size).toEqual({ width: 220, height: 60 });
  });

  it("should return default size for unknown types", () => {
    const size = getStateSize("Unknown");
    expect(size).toEqual({ width: 220, height: 60 });
  });
});

describe("calculateGroupBounds", () => {
  const createChildNode = (id: string, branchIndex: number = 0): StateNode => ({
    id,
    name: id,
    type: "Task",
    definition: { Type: "Task", Resource: "arn:..." },
    position: { x: 0, y: 0 },
    size: { width: 230, height: 60 },
    connections: [],
    isStartState: false,
    isEndState: false,
    branchIndex,
  });

  it("should return default bounds for empty children", () => {
    const bounds = calculateGroupBounds("Parallel", []);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });

  it("should calculate Parallel bounds based on branches", () => {
    const children = [
      createChildNode("A", 0),
      createChildNode("B", 0),
      createChildNode("C", 1),
    ];

    const bounds = calculateGroupBounds("Parallel", children);

    expect(bounds.width).toBeGreaterThan(300);
    expect(bounds.height).toBeGreaterThan(100);
  });

  it("should calculate Map bounds vertically", () => {
    const children = [
      createChildNode("A"),
      createChildNode("B"),
      createChildNode("C"),
    ];

    const bounds = calculateGroupBounds("Map", children);

    expect(bounds.width).toBe(300);
    expect(bounds.height).toBeGreaterThan(100);
  });

  it("should scale with number of children", () => {
    const twoChildren = [createChildNode("A"), createChildNode("B")];
    const fiveChildren = [
      createChildNode("A"),
      createChildNode("B"),
      createChildNode("C"),
      createChildNode("D"),
      createChildNode("E"),
    ];

    const boundsTwo = calculateGroupBounds("Map", twoChildren);
    const boundsFive = calculateGroupBounds("Map", fiveChildren);

    expect(boundsFive.height).toBeGreaterThan(boundsTwo.height);
  });

  it("should handle Parallel with multiple branches correctly", () => {
    const children = [
      createChildNode("A1", 0),
      createChildNode("A2", 0),
      createChildNode("B1", 1),
      createChildNode("C1", 2),
      createChildNode("C2", 2),
      createChildNode("C3", 2),
    ];

    const bounds = calculateGroupBounds("Parallel", children);

    // 3 branches should make it wider
    expect(bounds.width).toBeGreaterThan(500);
  });
});
