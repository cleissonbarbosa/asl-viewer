/**
 * Duration of layout transitions (expand / collapse, direction change).
 */
export const ANIMATION_DURATION = 320; // milliseconds

/**
 * Easing functions for smooth animations
 */
export const easingFunctions = {
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

/**
 * True when the user asked the operating system to minimise motion.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
