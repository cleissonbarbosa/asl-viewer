import { StateNode } from "../../types";

/**
 * CSS transition styles for smooth node movement
 */
export const nodeTransitionStyles = {
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  transitionProperty: "transform, opacity, width, height",
};

/**
 * Animation timing constants
 */
export const ANIMATION_DURATION = 300; // milliseconds
export const STAGGER_DELAY = 50; // milliseconds between node animations

/**
 * Calculates staggered animation delays for smoother transitions
 */
export function calculateAnimationDelays(
  nodes: StateNode[],
  expandedNodeId?: string,
): Map<string, number> {
  const delays = new Map<string, number>();

  if (!expandedNodeId) {
    // No specific expansion, use simple distance-based delay
    nodes.forEach((node, index) => {
      delays.set(node.id, index * STAGGER_DELAY);
    });
    return delays;
  }

  // Find the expanded node
  const expandedNode = nodes.find((n) => n.id === expandedNodeId);
  if (!expandedNode) {
    return delays;
  }

  // Calculate delays based on distance from expanded node
  nodes.forEach((node) => {
    if (node.id === expandedNodeId) {
      delays.set(node.id, 0);
      return;
    }

    // Calculate vertical distance from expanded node
    const distance = Math.abs(node.position.y - expandedNode.position.y);
    const delay = Math.min((distance / 100) * STAGGER_DELAY, STAGGER_DELAY * 5);
    delays.set(node.id, delay);
  });

  return delays;
}

/**
 * Generates CSS transform for smooth node transitions
 */
export function getNodeTransform(
  currentPosition: { x: number; y: number },
  targetPosition: { x: number; y: number },
  progress: number,
): string {
  const x =
    currentPosition.x + (targetPosition.x - currentPosition.x) * progress;
  const y =
    currentPosition.y + (targetPosition.y - currentPosition.y) * progress;

  return `translate(${x}px, ${y}px)`;
}

/**
 * Easing functions for smooth animations
 */
export const easingFunctions = {
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/**
 * Animation state interface
 */
export interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  fromPositions: Map<string, { x: number; y: number }>;
  toPositions: Map<string, { x: number; y: number }>;
}

/**
 * Manages animation state for node transitions
 */
export class NodeAnimationManager {
  private animationState: AnimationState | null = null;
  private animationFrame: number | null = null;
  private onUpdate?: (
    progress: number,
    positions: Map<string, { x: number; y: number }>,
  ) => void;

  /**
   * Starts a new animation between node positions
   */
  startAnimation(
    fromNodes: StateNode[],
    toNodes: StateNode[],
    duration: number = ANIMATION_DURATION,
    onUpdate?: (
      progress: number,
      positions: Map<string, { x: number; y: number }>,
    ) => void,
  ): void {
    // Stop any existing animation
    this.stopAnimation();

    // Create position maps
    const fromPositions = new Map<string, { x: number; y: number }>();
    const toPositions = new Map<string, { x: number; y: number }>();

    fromNodes.forEach((node) => {
      fromPositions.set(node.id, { ...node.position });
    });

    toNodes.forEach((node) => {
      toPositions.set(node.id, { ...node.position });
    });

    // Initialize animation state
    this.animationState = {
      isAnimating: true,
      startTime: performance.now(),
      duration,
      fromPositions,
      toPositions,
    };

    this.onUpdate = onUpdate;

    // Start animation loop
    this.animate();
  }

  /**
   * Stops the current animation
   */
  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.animationState = null;
    this.onUpdate = undefined;
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.animationState) return;

    const now = performance.now();
    const elapsed = now - this.animationState.startTime;
    const progress = Math.min(elapsed / this.animationState.duration, 1);

    // Apply easing
    const easedProgress = easingFunctions.easeOutCubic(progress);

    // Calculate current positions
    const currentPositions = new Map<string, { x: number; y: number }>();

    this.animationState.fromPositions.forEach((fromPos, nodeId) => {
      const toPos = this.animationState!.toPositions.get(nodeId);
      if (toPos) {
        currentPositions.set(nodeId, {
          x: fromPos.x + (toPos.x - fromPos.x) * easedProgress,
          y: fromPos.y + (toPos.y - fromPos.y) * easedProgress,
        });
      }
    });

    // Call update callback
    if (this.onUpdate) {
      this.onUpdate(easedProgress, currentPositions);
    }

    // Continue animation or finish
    if (progress < 1) {
      this.animationFrame = requestAnimationFrame(this.animate);
    } else {
      this.stopAnimation();
    }
  };

  /**
   * Checks if animation is currently running
   */
  isAnimating(): boolean {
    return this.animationState?.isAnimating ?? false;
  }
}
