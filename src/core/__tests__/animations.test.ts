import {
  nodeTransitionStyles,
  calculateAnimationDelays,
  getNodeTransform,
  easingFunctions,
  NodeAnimationManager,
  ANIMATION_DURATION,
  STAGGER_DELAY,
} from "../layout/animations";
import { StateNode } from "../../types";

function createNode(id: string, x: number, y: number): StateNode {
  return {
    id,
    name: id,
    type: "Task",
    definition: { Type: "Task", Resource: "arn:..." },
    position: { x, y },
    size: { width: 230, height: 60 },
    connections: [],
    isStartState: false,
    isEndState: false,
  };
}

describe("nodeTransitionStyles", () => {
  it("should have transition property", () => {
    expect(nodeTransitionStyles.transition).toBeDefined();
    expect(typeof nodeTransitionStyles.transition).toBe("string");
  });

  it("should include cubic-bezier easing", () => {
    expect(nodeTransitionStyles.transition).toContain("cubic-bezier");
  });
});

describe("constants", () => {
  it("should have reasonable animation duration", () => {
    expect(ANIMATION_DURATION).toBeGreaterThan(0);
    expect(ANIMATION_DURATION).toBeLessThanOrEqual(1000);
  });

  it("should have reasonable stagger delay", () => {
    expect(STAGGER_DELAY).toBeGreaterThan(0);
    expect(STAGGER_DELAY).toBeLessThanOrEqual(200);
  });
});

describe("calculateAnimationDelays", () => {
  it("should assign sequential delays without expanded node", () => {
    const nodes = [
      createNode("A", 0, 0),
      createNode("B", 0, 100),
      createNode("C", 0, 200),
    ];

    const delays = calculateAnimationDelays(nodes);

    expect(delays.get("A")).toBe(0);
    expect(delays.get("B")).toBe(STAGGER_DELAY);
    expect(delays.get("C")).toBe(STAGGER_DELAY * 2);
  });

  it("should assign distance-based delays with expanded node", () => {
    const nodes = [
      createNode("A", 0, 0),
      createNode("B", 0, 100),
      createNode("C", 0, 500),
    ];

    const delays = calculateAnimationDelays(nodes, "A");

    expect(delays.get("A")).toBe(0); // Expanded node has 0 delay
    // Further nodes should have larger delays
    const delayB = delays.get("B")!;
    const delayC = delays.get("C")!;
    expect(delayC).toBeGreaterThan(delayB);
  });

  it("should return empty map for empty nodes", () => {
    const delays = calculateAnimationDelays([]);
    expect(delays.size).toBe(0);
  });

  it("should handle missing expanded node gracefully", () => {
    const nodes = [createNode("A", 0, 0)];
    const delays = calculateAnimationDelays(nodes, "NonExistent");
    // Should still return delays, just empty if node not found
    expect(delays.size).toBe(0);
  });
});

describe("getNodeTransform", () => {
  it("should return start position at progress 0", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 200 };

    const transform = getNodeTransform(from, to, 0);

    expect(transform).toBe("translate(0px, 0px)");
  });

  it("should return end position at progress 1", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 200 };

    const transform = getNodeTransform(from, to, 1);

    expect(transform).toBe("translate(100px, 200px)");
  });

  it("should return midpoint at progress 0.5", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 200 };

    const transform = getNodeTransform(from, to, 0.5);

    expect(transform).toBe("translate(50px, 100px)");
  });
});

describe("easingFunctions", () => {
  describe("easeOutCubic", () => {
    it("should return 0 at t=0", () => {
      expect(easingFunctions.easeOutCubic(0)).toBe(0);
    });

    it("should return 1 at t=1", () => {
      expect(easingFunctions.easeOutCubic(1)).toBe(1);
    });

    it("should be monotonically increasing", () => {
      let prev = 0;
      for (let t = 0; t <= 1; t += 0.1) {
        const val = easingFunctions.easeOutCubic(t);
        expect(val).toBeGreaterThanOrEqual(prev);
        prev = val;
      }
    });

    it("should ease out (faster start, slower end)", () => {
      const firstHalf = easingFunctions.easeOutCubic(0.5);
      // For ease-out, > 0.5 at midpoint
      expect(firstHalf).toBeGreaterThan(0.5);
    });
  });

  describe("easeInOutCubic", () => {
    it("should return 0 at t=0", () => {
      expect(easingFunctions.easeInOutCubic(0)).toBe(0);
    });

    it("should return 1 at t=1", () => {
      expect(easingFunctions.easeInOutCubic(1)).toBe(1);
    });

    it("should return ~0.5 at t=0.5", () => {
      expect(easingFunctions.easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
    });
  });

  describe("easeOutBack", () => {
    it("should return 0 at t=0", () => {
      expect(easingFunctions.easeOutBack(0)).toBeCloseTo(0, 5);
    });

    it("should return 1 at t=1", () => {
      expect(easingFunctions.easeOutBack(1)).toBeCloseTo(1, 5);
    });

    it("should overshoot slightly (characteristic of back easing)", () => {
      // easeOutBack typically overshoots 1 before settling
      let maxVal = 0;
      for (let t = 0; t <= 1; t += 0.01) {
        maxVal = Math.max(maxVal, easingFunctions.easeOutBack(t));
      }
      expect(maxVal).toBeGreaterThan(1);
    });
  });
});

describe("NodeAnimationManager", () => {
  // Mock requestAnimationFrame and cancelAnimationFrame
  let rafCallbacks: (() => void)[] = [];
  let rafId = 0;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    // eslint-disable-next-line no-undef
    (globalThis as any).requestAnimationFrame = jest.fn(
      (cb: (time: number) => void) => {
        rafCallbacks.push(() => cb(performance.now()));
        return ++rafId;
      },
    ) as any;
    // eslint-disable-next-line no-undef
    (globalThis as any).cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should not be animating initially", () => {
    const manager = new NodeAnimationManager();
    expect(manager.isAnimating()).toBe(false);
  });

  it("should start animation and report animating state", () => {
    const manager = new NodeAnimationManager();
    const fromNodes = [createNode("A", 0, 0)];
    const toNodes = [createNode("A", 100, 100)];

    manager.startAnimation(fromNodes, toNodes);

    expect(manager.isAnimating()).toBe(true);
  });

  it("should stop animation", () => {
    const manager = new NodeAnimationManager();
    const fromNodes = [createNode("A", 0, 0)];
    const toNodes = [createNode("A", 100, 100)];

    manager.startAnimation(fromNodes, toNodes);
    manager.stopAnimation();

    expect(manager.isAnimating()).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("should call onUpdate during animation", () => {
    const manager = new NodeAnimationManager();
    const fromNodes = [createNode("A", 0, 0)];
    const toNodes = [createNode("A", 100, 100)];
    const onUpdate = jest.fn();

    manager.startAnimation(fromNodes, toNodes, 300, onUpdate);

    // Trigger the animation frame
    if (rafCallbacks.length > 0) {
      rafCallbacks[0]();
    }

    expect(onUpdate).toHaveBeenCalled();
  });

  it("should stop previous animation when starting new one", () => {
    const manager = new NodeAnimationManager();
    const fromNodes = [createNode("A", 0, 0)];
    const toNodes = [createNode("A", 100, 100)];

    manager.startAnimation(fromNodes, toNodes);
    manager.startAnimation(fromNodes, toNodes); // Start again

    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
