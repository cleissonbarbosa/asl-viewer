import { createGraphLayout } from "../layout";
import { calculateHierarchicalLayout } from "../layout/hierarchical-layout";
import { ASLDefinition, GraphLayout, StateNode } from "../../types";
import {
  complexWorkflowDefinition,
  ecommerceWorkflowDefinition,
  dataProcessingWorkflowDefinition,
  modernWorkflowDefinition,
} from "../../components/stories/workflow-definitions";
import { validateASLDefinition } from "../validation";
import complexExample from "../../../examples/complex-workflow.json";
import parallelExample from "../../../examples/parallel-workflow.json";

const byId = (layout: GraphLayout, id: string): StateNode => {
  const node = layout.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Node ${id} not found`);
  return node;
};

const overlaps = (a: StateNode, b: StateNode) =>
  a.position.x < b.position.x + b.size.width &&
  b.position.x < a.position.x + a.size.width &&
  a.position.y < b.position.y + b.size.height &&
  b.position.y < a.position.y + a.size.height;

const fixtures: Array<[string, ASLDefinition]> = [
  ["complex story", complexWorkflowDefinition],
  ["e-commerce story", ecommerceWorkflowDefinition],
  ["data processing story", dataProcessingWorkflowDefinition],
  ["modern ASL story", modernWorkflowDefinition],
  ["complex example", complexExample as unknown as ASLDefinition],
  ["parallel example", parallelExample as unknown as ASLDefinition],
];

const mergeWorkflow: ASLDefinition = {
  StartAt: "Route",
  States: {
    Route: {
      Type: "Choice",
      Choices: [{ Variable: "$.long", BooleanEquals: true, Next: "StepA" }],
      Default: "Merge",
    },
    StepA: { Type: "Pass", Next: "StepB" },
    StepB: { Type: "Pass", Next: "Merge" },
    Merge: { Type: "Succeed" },
  },
};

const loopWorkflow: ASLDefinition = {
  StartAt: "Submit",
  States: {
    Submit: {
      Type: "Task",
      Resource: "arn:aws:states:::lambda:invoke",
      Next: "Wait",
    },
    Wait: { Type: "Wait", Seconds: 30, Next: "Check" },
    Check: {
      Type: "Choice",
      Choices: [
        { Variable: "$.status", StringEquals: "RUNNING", Next: "Wait" },
      ],
      Default: "Done",
    },
    Done: { Type: "Succeed" },
  },
};

describe("Layered layout engine", () => {
  describe.each(fixtures)("%s", (_name, definition) => {
    it.each(["TB", "LR"] as const)(
      "places nodes without overlaps (%s)",
      (direction) => {
        const layout = createGraphLayout(definition, direction);
        const nodes = layout.nodes.filter((n) => !n.parentId);
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            expect(overlaps(nodes[i], nodes[j])).toBe(false);
          }
        }
      },
    );

    it("is a valid definition", () => {
      expect(
        validateASLDefinition(definition).filter((e) => e.severity === "error"),
      ).toEqual([]);
    });

    it("puts START first and END last", () => {
      const layout = createGraphLayout(definition, "TB");
      const start = byId(layout, "__start__");
      const end = byId(layout, "__end__");
      for (const node of layout.nodes) {
        if (node.id !== "__start__") {
          expect(node.position.y).toBeGreaterThan(start.position.y);
        }
        if (node.id !== "__end__") {
          expect(node.position.y).toBeLessThan(end.position.y);
        }
      }
    });

    it("routes every edge that has both endpoints in the graph", () => {
      const layout = createGraphLayout(definition, "TB");
      const ids = new Set(layout.nodes.map((n) => n.id));
      for (const edge of layout.edges) {
        if (ids.has(edge.from) && ids.has(edge.to)) {
          expect(edge.points?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  it("places a merge state below the longest path that reaches it", () => {
    const layout = createGraphLayout(mergeWorkflow);
    expect(byId(layout, "Merge").position.y).toBeGreaterThan(
      byId(layout, "StepB").position.y,
    );
  });

  it("starts each forward edge below the source and ends above the target", () => {
    const layout = createGraphLayout(mergeWorkflow);
    for (const edge of layout.edges) {
      const source = byId(layout, edge.from);
      const target = byId(layout, edge.to);
      const first = edge.points![0];
      const last = edge.points![edge.points!.length - 1];
      expect(first.x).toBeCloseTo(source.position.x + source.size.width / 2);
      expect(first.y).toBeGreaterThan(source.position.y + source.size.height);
      expect(last.x).toBeCloseTo(target.position.x + target.size.width / 2);
      expect(last.y).toBeLessThan(target.position.y);
    }
  });

  it("aligns edge endpoints with the side handles in LR layouts", () => {
    const layout = createGraphLayout(mergeWorkflow, "LR");
    for (const edge of layout.edges) {
      const source = byId(layout, edge.from);
      const first = edge.points![0];
      expect(first.y).toBeCloseTo(source.position.y + source.size.height / 2);
      expect(first.x).toBeGreaterThan(source.position.x + source.size.width);
    }
  });

  it("routes loops around the right side of the nodes they span", () => {
    const layout = createGraphLayout(loopWorkflow);
    const loop = layout.edges.find(
      (e) => e.from === "Check" && e.to === "Wait",
    )!;
    const check = byId(layout, "Check");
    const wait = byId(layout, "Wait");
    const laneX = Math.max(...loop.points!.map((p) => p.x));
    expect(laneX).toBeGreaterThan(check.position.x + check.size.width);
    expect(laneX).toBeGreaterThan(wait.position.x + wait.size.width);
    // The loop target stays above its source
    expect(wait.position.y).toBeLessThan(check.position.y);
  });

  it("lays out expanded groups with their full size", () => {
    const definition: ASLDefinition = {
      StartAt: "Fan",
      States: {
        Fan: {
          Type: "Parallel",
          Branches: [
            {
              StartAt: "A1",
              States: {
                A1: { Type: "Pass", Next: "A2" },
                A2: { Type: "Pass", End: true },
              },
            },
            { StartAt: "B1", States: { B1: { Type: "Pass", End: true } } },
          ],
          Next: "After",
        },
        After: { Type: "Succeed" },
      },
    };

    const collapsed = createGraphLayout(definition);
    const expanded = createGraphLayout(definition, "TB", {
      expandedGroups: ["Fan"],
    });

    const group = byId(expanded, "Fan");
    expect(group.isExpanded).toBe(true);
    expect(group.size).toEqual(group.groupBounds);
    expect(byId(expanded, "After").position.y).toBeGreaterThan(
      group.position.y + group.size.height,
    );
    expect(byId(expanded, "After").position.y).toBeGreaterThan(
      byId(collapsed, "After").position.y,
    );
  });

  it("supports Map states that use ItemProcessor", () => {
    const definition: ASLDefinition = {
      StartAt: "ForEach",
      States: {
        ForEach: {
          Type: "Map",
          ItemProcessor: {
            ProcessorConfig: { Mode: "DISTRIBUTED", ExecutionType: "EXPRESS" },
            StartAt: "Load",
            States: {
              Load: {
                Type: "Task",
                Resource: "arn:aws:states:::lambda:invoke",
                Next: "Save",
              },
              Save: {
                Type: "Task",
                Resource: "arn:aws:states:::dynamodb:putItem",
                End: true,
              },
            },
          },
          End: true,
        },
      },
    };

    const group = byId(createGraphLayout(definition), "ForEach");
    expect(group.isGroup).toBe(true);
    expect(group.children?.map((c) => c.name)).toEqual(["Load", "Save"]);
  });

  it("orders group children by execution flow", () => {
    const definition: ASLDefinition = {
      StartAt: "ForEach",
      States: {
        ForEach: {
          Type: "Map",
          Iterator: {
            StartAt: "First",
            States: {
              Last: { Type: "Succeed" },
              First: { Type: "Pass", Next: "Middle" },
              Middle: { Type: "Pass", Next: "Last" },
            },
          },
          End: true,
        },
      },
    };

    const group = byId(createGraphLayout(definition), "ForEach");
    expect(group.children?.map((c) => c.name)).toEqual([
      "First",
      "Middle",
      "Last",
    ]);
  });

  it("is deterministic and does not mutate its input", () => {
    const first = createGraphLayout(complexWorkflowDefinition);
    const snapshot = JSON.stringify(first.nodes);
    const relaid = calculateHierarchicalLayout(
      first.nodes,
      first.edges,
      "__start__",
      "LR",
    );
    expect(JSON.stringify(first.nodes)).toBe(snapshot);
    expect(relaid.nodes).not.toBe(first.nodes);
    expect(JSON.stringify(createGraphLayout(complexWorkflowDefinition))).toBe(
      JSON.stringify(first),
    );
  });

  it("lays out large workflows quickly", () => {
    const states: ASLDefinition["States"] = {};
    for (let i = 0; i < 400; i++) {
      states[`Step${i}`] =
        i % 10 === 0
          ? {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.x",
                  NumericEquals: i,
                  Next: `Step${Math.min(i + 5, 399)}`,
                },
              ],
              Default: `Step${i + 1}`,
            }
          : i === 399
            ? { Type: "Succeed" }
            : {
                Type: "Task",
                Resource: "arn:aws:states:::lambda:invoke",
                Next: `Step${i + 1}`,
                Catch: [{ ErrorEquals: ["States.ALL"], Next: "Step399" }],
              };
    }

    const started = Date.now();
    const layout = createGraphLayout({ StartAt: "Step0", States: states });
    expect(layout.nodes).toHaveLength(402);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
