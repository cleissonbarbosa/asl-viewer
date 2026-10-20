import type { Pose } from "./motion";

/** Simulated user input on the real components. */

export function within(rootId: string) {
  const root = () => document.getElementById(rootId);
  const find = (selector: string) =>
    root()?.querySelector<HTMLElement>(selector) ?? null;
  return {
    root,
    find,
    button: (label: string) => find(`button[aria-label="${label}"]`),
    buttonStartingWith: (label: string) =>
      find(`button[aria-label^="${label}"]`),
    node: (name: string) =>
      find(`.react-flow__node [role="button"][aria-label$=" state ${name}"]`),
    search: () =>
      find('input[aria-label="Search states"]') as HTMLInputElement | null,
    panel: () => find(".asl-panel"),
  };
}

export function click(element: Element | null) {
  if (!element) {
    console.warn("promo: nothing to click");
    return;
  }
  (element as HTMLElement).click();
}

/** Sets a React-controlled input value and notifies React. */
export function setInputValue(input: HTMLInputElement | null, value: string) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function pressKey(element: Element | null, key: string) {
  element?.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
}

export interface Point {
  x: number;
  y: number;
}

/** Point inside an element, in frame coordinates (0..1 of its box). */
export function pointOf(
  element: Element | null,
  fx = 0.5,
  fy = 0.5,
): Point | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width * fx, y: rect.top + rect.height * fy };
}

/**
 * Window pose that shows `element` (at relative point fx, fy) at frame
 * point `target` with scale `scale`. `current` is the pose the element was
 * measured under.
 */
export function poseFocusing(
  element: Element | null,
  current: Pose,
  scale: number,
  target: Point,
  fx = 0.5,
  fy = 0.5,
): Pose {
  const point = pointOf(element, fx, fy);
  if (!point) return current;
  const localX = (point.x - current.x) / current.s;
  const localY = (point.y - current.y) / current.s;
  return {
    x: target.x - localX * scale,
    y: target.y - localY * scale,
    s: scale,
  };
}
