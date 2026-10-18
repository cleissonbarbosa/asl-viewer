import { isDarkColor, themeToCssVars, withAlpha } from "../theme-vars";
import { findSearchMatches, locateState } from "../search";
import { highlightJson } from "../JsonView";
import { roundedPath } from "../ReactFlowEdge";
import { darkTheme, lightTheme } from "../../core/theme";
import { createGraphLayout } from "../../core/layout";
import { ASLDefinition } from "../../types";

describe("theme variables", () => {
  it("maps every theme color to a CSS custom property", () => {
    const vars = themeToCssVars(darkTheme) as Record<string, string>;
    expect(vars["--asl-bg"]).toBe(darkTheme.background);
    expect(vars["--asl-task-border"]).toBe(darkTheme.nodeBorderColors.task);
    expect(vars["--asl-stepfn-hover"]).toBe(
      darkTheme.nodeHoverColors.stepFunction,
    );
    expect(vars.colorScheme).toBe("dark");
    expect(
      (themeToCssVars(lightTheme) as Record<string, string>).colorScheme,
    ).toBe("light");
  });

  it("accepts partial themes", () => {
    expect(themeToCssVars({ infoColor: "#007acc" })).toEqual({
      "--asl-info": "#007acc",
    });
    expect(themeToCssVars(undefined)).toEqual({});
  });

  it("converts colors to rgba", () => {
    expect(withAlpha("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
    expect(withAlpha("#0f0", 1)).toBe("rgba(0, 255, 0, 1)");
    expect(withAlpha("#743902ff", 0.2)).toBe("rgba(116, 57, 2, 0.2)");
    expect(withAlpha("rgba(10, 20, 30, 0.9)", 0.1)).toBe(
      "rgba(10, 20, 30, 0.1)",
    );
    expect(withAlpha("red", 0.3)).toBe("red");
  });

  it("detects dark colors", () => {
    expect(isDarkColor("#0f172a")).toBe(true);
    expect(isDarkColor("#f8f9fa")).toBe(false);
    expect(isDarkColor("not-a-color")).toBe(false);
  });
});

describe("search", () => {
  const definition: ASLDefinition = {
    StartAt: "LoadOrders",
    States: {
      LoadOrders: { Type: "Pass", Next: "ProcessAll" },
      ProcessAll: {
        Type: "Map",
        ItemProcessor: {
          StartAt: "ProcessOrder",
          States: { ProcessOrder: { Type: "Pass", End: true } },
        },
        End: true,
      },
    },
  };

  it("finds top-level and nested states, case-insensitively", () => {
    const { nodes } = createGraphLayout(definition);
    const matches = findSearchMatches(nodes, "PROCESS");
    expect(matches.map((m) => m.id)).toEqual([
      "ProcessAll",
      "ProcessAll_iterator_ProcessOrder",
    ]);
    // Nested matches point at the group that contains them
    expect(matches[1].nodeId).toBe("ProcessAll");
    expect(findSearchMatches(nodes, "  ")).toEqual([]);
  });

  it("locates nested states inside expanded groups", () => {
    const collapsed = createGraphLayout(definition).nodes;
    const expanded = createGraphLayout(definition, "TB", {
      expandedGroups: ["ProcessAll"],
    }).nodes;
    const id = "ProcessAll_iterator_ProcessOrder";
    const inCollapsed = locateState(collapsed, id)!;
    const inExpanded = locateState(expanded, id)!;
    const group = expanded.find((n) => n.id === "ProcessAll")!;

    expect(inCollapsed.nodeId).toBe("ProcessAll");
    expect(inExpanded.center.y).toBeGreaterThan(group.position.y + 60);
    expect(inExpanded.center.y).toBeLessThan(
      group.position.y + group.size.height,
    );
    expect(locateState(expanded, "Missing")).toBeNull();
  });
});

describe("highlightJson", () => {
  it("keeps the original text and tags tokens", () => {
    const json = JSON.stringify({ a: "x", b: 1, c: true, d: null }, null, 2);
    const nodes = highlightJson(json);
    const text = nodes
      .map((node) =>
        typeof node === "string"
          ? node
          : String((node as { props: { children: string } }).props.children),
      )
      .join("");
    expect(text).toBe(json);
    const classes = nodes
      .filter((node) => typeof node !== "string")
      .map(
        (node) => (node as { props: { className: string } }).props.className,
      );
    expect(classes).toEqual(
      expect.arrayContaining([
        "asl-json__key",
        "asl-json__string",
        "asl-json__number",
        "asl-json__literal",
      ]),
    );
  });
});

describe("roundedPath", () => {
  it("draws straight segments and rounds corners", () => {
    expect(
      roundedPath([
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 0, y: 100 },
      ]),
    ).toBe("M 0,0 L 0,50 L 0,100");

    const path = roundedPath([
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 80, y: 50 },
    ]);
    expect(path).toContain("Q 0,50");
    expect(path.endsWith("L 80,50")).toBe(true);
  });
});
