export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t: number) =>
    t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2,
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t: number) =>
    t <= 0
      ? 0
      : t >= 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
} satisfies Record<string, Ease>;

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/** Linear progress of `t` through [start, start + duration], clamped. */
export const progress = (t: number, start: number, duration: number) =>
  duration <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / duration);

export const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

/** Eased value between `from` and `to` over [start, start + duration]. */
export function tween(
  t: number,
  start: number,
  duration: number,
  from: number,
  to: number,
  easing: Ease = ease.outCubic,
) {
  return lerp(from, to, easing(progress(t, start, duration)));
}

/**
 * Visibility envelope: fades in over `fadeIn` from `start`, out over
 * `fadeOut` ending at `end`.
 */
export function envelope(
  t: number,
  start: number,
  end: number,
  fadeIn = 400,
  fadeOut = 400,
  easing: Ease = ease.outCubic,
) {
  if (t < start || t > end) return 0;
  const enter = easing(progress(t, start, fadeIn));
  const exit = 1 - ease.inCubic(progress(t, end - fadeOut, fadeOut));
  return Math.min(enter, exit);
}

export interface Pose {
  x: number;
  y: number;
  s: number;
}

export const lerpPose = (a: Pose, b: Pose, amount: number): Pose => ({
  x: lerp(a.x, b.x, amount),
  y: lerp(a.y, b.y, amount),
  s: lerp(a.s, b.s, amount),
});

export interface Move {
  at: number;
  duration: number;
  /** A pose, or a function resolved once when the move starts. */
  to: Pose | ((current: Pose) => Pose);
  easing?: Ease;
}

/**
 * A pose animated by a list of moves. Moves are resolved lazily, in order,
 * so a move can target where a DOM element is at the moment it starts.
 * Time only goes forward while recording, which keeps this deterministic.
 */
export class Track {
  private resolved: { from: Pose; to: Pose }[] = [];

  constructor(
    private initial: Pose,
    private moves: Move[],
  ) {
    this.moves = [...moves].sort((a, b) => a.at - b.at);
  }

  at(t: number): Pose {
    let pose = this.initial;
    for (let i = 0; i < this.moves.length; i++) {
      const move = this.moves[i];
      if (t < move.at) break;
      if (!this.resolved[i]) {
        const to = typeof move.to === "function" ? move.to(pose) : move.to;
        this.resolved[i] = { from: pose, to };
      }
      const { from, to } = this.resolved[i];
      const amount = (move.easing ?? ease.inOutCubic)(
        progress(t, move.at, move.duration),
      );
      pose = lerpPose(from, to, amount);
    }
    return pose;
  }
}
