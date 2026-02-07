import {
  calculateReactiveLayout,
  calculateImprovedSpacing,
  LayoutCache,
} from "../layout/reactive-layout";
import { StateNode, Connection } from "../../types";

function createNode(
  id: string,
  x: number,
  y: number,
  isGroup = false,
  children?: StateNode[],
): StateNode {
  return {
    id,
    name: id,
    type: isGroup ? "Parallel" : "Task",
    definition: isGroup
      ? {
          Type: "Parallel",
          Branches: [
            { StartAt: "A", States: { A: { Type: "Pass", End: true } } },
          ],
        }
      : { Type: "Task", Resource: "arn:..." },
    position: { x, y },
    size: isGroup ? { width: 260, height: 60 } : { width: 230, height: 60 },
    connections: [],
    isStartState: false,
    isEndState: false,
    isGroup,
    children,
    isExpanded: false,
    groupBounds: isGroup ? { width: 400, height: 300 } : undefined,
  };
}

describe("calculateReactiveLayout", () => {
  it("should return nodes unchanged when no expansion changes", () => {
    const nodes = [createNode("A", 0, 0), createNode("B", 0, 100)];
    const edges: Connection[] = [];
    const expandedIds = new Set<string>();
    const cache: LayoutCache = {
      originalPositions: new Map(),
      expandedNodes: new Set(),
    };

    const result = calculateReactiveLayout(nodes, edges, expandedIds, cache);

    expect(result).toHaveLength(2);
    expect(result[0].position.y).toBe(0);
    expect(result[1].position.y).toBe(100);
  });

  it("should shift nodes when a group is expanded", () => {
    const children = [createNode("child1", 0, 0), createNode("child2", 0, 60)];
    const nodes = [
      createNode("GroupA", 0, 0, true, children),
      createNode("B", 0, 100),
    ];
    const edges: Connection[] = [];
    const cache: LayoutCache = {
      originalPositions: new Map(),
      expandedNodes: new Set(),
    };

    // First call: no expansion
    calculateReactiveLayout(nodes, edges, new Set(), cache);

    // Second call: expand GroupA
    const expandedIds = new Set(["GroupA"]);
    const result = calculateReactiveLayout(nodes, edges, expandedIds, cache);

    // Node B should be shifted down to accommodate expanded GroupA
    const bNode = result.find((n) => n.id === "B");
    expect(bNode!.position.y).toBeGreaterThan(100);
  });

  it("should restore positions when group is collapsed", () => {
    const children = [createNode("child1", 0, 0)];
    const nodes = [
      createNode("GroupA", 0, 0, true, children),
      createNode("B", 0, 100),
    ];
    const edges: Connection[] = [];
    const cache: LayoutCache = {
      originalPositions: new Map(),
      expandedNodes: new Set(),
    };

    // First call: cache positions
    calculateReactiveLayout(nodes, edges, new Set(), cache);

    // Second call: expand
    calculateReactiveLayout(nodes, edges, new Set(["GroupA"]), cache);

    // Third call: collapse again
    const result = calculateReactiveLayout(nodes, edges, new Set(), cache);

    const bNode = result.find((n) => n.id === "B");
    expect(bNode!.position.y).toBe(100);
  });

  it("should handle empty nodes array", () => {
    const cache: LayoutCache = {
      originalPositions: new Map(),
      expandedNodes: new Set(),
    };

    const result = calculateReactiveLayout([], [], new Set(), cache);

    expect(result).toHaveLength(0);
  });
});

describe("calculateImprovedSpacing", () => {
  it("should return base spacing for simple nodes", () => {
    const nodes: StateNode[] = [createNode("A", 0, 0), createNode("B", 0, 100)];
    const edges: Connection[] = [];

    const { nodeSpacing, levelSpacing } = calculateImprovedSpacing(
      nodes,
      edges,
    );

    expect(nodeSpacing).toBeGreaterThanOrEqual(60);
    expect(levelSpacing).toBeGreaterThanOrEqual(60);
  });

  it("should increase spacing for labeled edges", () => {
    const nodes: StateNode[] = [createNode("A", 0, 0), createNode("B", 0, 100)];
    const edgesNoLabel: Connection[] = [{ from: "A", to: "B", type: "next" }];
    const edgesWithLabel: Connection[] = [
      { from: "A", to: "B", type: "choice", label: "Check condition" },
    ];

    const spacingNoLabel = calculateImprovedSpacing(nodes, edgesNoLabel);
    const spacingWithLabel = calculateImprovedSpacing(nodes, edgesWithLabel);

    expect(spacingWithLabel.levelSpacing).toBeGreaterThan(
      spacingNoLabel.levelSpacing,
    );
  });

  it("should increase spacing for multiple choices", () => {
    const nodes: StateNode[] = [createNode("A", 0, 0)];
    const singleChoice: Connection[] = [{ from: "A", to: "B", type: "choice" }];
    const multipleChoices: Connection[] = [
      { from: "A", to: "B", type: "choice" },
      { from: "A", to: "C", type: "choice" },
      { from: "A", to: "D", type: "choice" },
    ];

    const spacingSingle = calculateImprovedSpacing(nodes, singleChoice);
    const spacingMultiple = calculateImprovedSpacing(nodes, multipleChoices);

    expect(spacingMultiple.nodeSpacing).toBeGreaterThan(
      spacingSingle.nodeSpacing,
    );
  });

  it("should increase spacing for error handling", () => {
    const nodes: StateNode[] = [createNode("A", 0, 0)];
    const noErrors: Connection[] = [];
    const withErrors: Connection[] = [{ from: "A", to: "Err", type: "error" }];

    const spacingNoErrors = calculateImprovedSpacing(nodes, noErrors);
    const spacingWithErrors = calculateImprovedSpacing(nodes, withErrors);

    expect(spacingWithErrors.levelSpacing).toBeGreaterThan(
      spacingNoErrors.levelSpacing,
    );
  });

  it("should increase spacing for group nodes", () => {
    const withoutGroup: StateNode[] = [createNode("A", 0, 0)];
    const withGroup: StateNode[] = [createNode("G", 0, 0, true)];
    const edges: Connection[] = [];

    const spacingNoGroup = calculateImprovedSpacing(withoutGroup, edges);
    const spacingWithGroup = calculateImprovedSpacing(withGroup, edges);

    expect(spacingWithGroup.nodeSpacing).toBeGreaterThan(
      spacingNoGroup.nodeSpacing,
    );
  });

  it("should cap spacing at reasonable maximums", () => {
    const nodes: StateNode[] = [createNode("G", 0, 0, true)];
    const edges: Connection[] = [
      { from: "A", to: "B", type: "choice", label: "Long label" },
      { from: "A", to: "C", type: "choice", label: "Another" },
      { from: "A", to: "D", type: "choice", label: "Third" },
      { from: "A", to: "E", type: "error", label: "Error" },
    ];

    const { nodeSpacing, levelSpacing } = calculateImprovedSpacing(
      nodes,
      edges,
    );

    expect(nodeSpacing).toBeLessThanOrEqual(200);
    expect(levelSpacing).toBeLessThanOrEqual(150);
  });
});
