import React, { useLayoutEffect, useMemo, useRef } from "react";
import { WorkflowViewer, type ThemeName } from "asl-viewer";
import {
  IconBolt,
  IconBraces,
  IconBrandGithub,
  IconBrandTypescript,
  IconBrandAws,
  IconBook2,
  IconFileCode,
  IconKeyboard,
  IconPalette,
  IconShieldCheck,
  IconCopy,
} from "@tabler/icons-react";
import { orderWorkflow } from "./workflow";
import { LogoMark } from "./Logo";
import { CodeCard, TYPING_DURATION } from "./Code";
import {
  Track,
  clamp,
  ease,
  envelope,
  lerp,
  progress,
  tween,
  type Move,
  type Pose,
} from "./motion";
import {
  click,
  poseFocusing,
  pressKey,
  setInputValue,
  within,
  type Point,
} from "./dom";

/* ------------------------------------------------------------------ */
/* Timeline (ms)                                                       */
/* ------------------------------------------------------------------ */

export const T = {
  code: 3600,
  typing: 4000,
  reveal: 4000 + TYPING_DURATION + 200,
  center: 9300,
  layout: 10000,
  groups: 14300,
  search: 19000,
  details: 24500,
  themes: 31000,
  direction: 37700,
  bento: 41700,
  outro: 46500,
  end: 51500,
};

export const DURATION = T.end;

const W = 1500;
const H = 844;
const BAR = 40;

const CENTER: Pose = { x: (1920 - W) / 2, y: 196, s: 1 };
const RIGHT: Pose = { x: 965, y: 334, s: 0.6 };
const TILE_S = 0.42;
const TILE_GAP = 36;
const TILE_X0 = (1920 - (W * TILE_S * 2 + TILE_GAP)) / 2;
const TILE_Y0 = 250;
const tile = (column: number, row: number): Pose => ({
  x: TILE_X0 + column * (W * TILE_S + TILE_GAP),
  y: TILE_Y0 + row * (H * TILE_S + TILE_GAP),
  s: TILE_S,
});

/** Scales a pose around a point of the frame. */
const zoomAbout = (pose: Pose, s: number, at: Point): Pose => ({
  x: at.x - ((at.x - pose.x) * s) / pose.s,
  y: at.y - ((at.y - pose.y) * s) / pose.s,
  s,
});

const main = within("main-window");

/* ------------------------------------------------------------------ */
/* Camera on the main window                                           */
/* ------------------------------------------------------------------ */

const cameraMoves: Move[] = [
  { at: T.code + 300, duration: 1100, to: RIGHT, easing: ease.outExpo },
  { at: T.center, duration: 1100, to: CENTER, easing: ease.inOutQuint },
  {
    at: T.layout + 300,
    duration: 1600,
    to: zoomAbout(CENTER, 1.12, { x: 960, y: 560 }),
    easing: ease.inOutCubic,
  },
  { at: T.groups - 200, duration: 800, to: CENTER },
  // Push in on the expanded groups once the re-layout has settled
  {
    at: T.groups + 2400,
    duration: 1300,
    to: zoomAbout(CENTER, 1.12, { x: 960, y: 600 }),
    easing: ease.inOutCubic,
  },
  { at: T.search - 400, duration: 900, to: CENTER, easing: ease.inOutQuint },
  // Search box close-up while typing
  {
    at: T.search + 500,
    duration: 900,
    to: (pose) =>
      poseFocusing(main.search(), pose, 1.6, { x: 1080, y: 470 }, 0.3, 0.5),
    easing: ease.inOutQuint,
  },
  {
    at: T.search + 2500,
    duration: 1000,
    to: zoomAbout(CENTER, 1.12, { x: 960, y: 640 }),
    easing: ease.inOutQuint,
  },
  { at: T.details - 300, duration: 800, to: CENTER },
  // Close-up on the details panel
  {
    at: T.details + 1500,
    duration: 1200,
    to: (pose) =>
      poseFocusing(main.panel(), pose, 1.42, { x: 1330, y: 560 }, 0.5, 0.3),
    easing: ease.inOutQuint,
  },
  { at: T.themes - 900, duration: 900, to: CENTER, easing: ease.inOutQuint },
  {
    at: T.themes + 2500,
    duration: 1100,
    to: tile(0, 0),
    easing: ease.inOutQuint,
  },
  {
    at: T.direction - 1000,
    duration: 1000,
    to: CENTER,
    easing: ease.inOutQuint,
  },

  {
    at: T.bento - 500,
    duration: 600,
    to: zoomAbout(CENTER, 0.9, { x: 960, y: 620 }),
    easing: ease.inCubic,
  },
];

/* ------------------------------------------------------------------ */
/* Simulated input                                                     */
/* ------------------------------------------------------------------ */

interface Cue {
  at: number;
  run: () => void;
  /** Shows a click of the cursor. */
  click?: boolean;
}

const tileIds = ["tile-dark", "tile-contrast", "tile-soft"];

function revealGraph(root: HTMLElement | null) {
  if (!root) return;
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>(".react-flow__node"),
  );
  const rank = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return rect.top + rect.left * 0.15;
  };
  nodes
    .sort((a, b) => rank(a) - rank(b))
    .forEach((node, index) => node.style.setProperty("--d", `${index * 65}ms`));
  root.querySelectorAll<SVGElement>(".react-flow__edge").forEach((edge) => {
    const top = edge.getBoundingClientRect().top;
    const first = nodes.length ? rank(nodes[0]) : 0;
    edge.style.setProperty(
      "--d",
      `${Math.max(0, (top - first) * 1.4) + 120}ms`,
    );
  });
}

function typing(at: number, text: string, interval: number): Cue[] {
  return Array.from(text, (_, index) => ({
    at: at + index * interval,
    run: () => setInputValue(main.search(), text.slice(0, index + 1)),
  }));
}

const SEARCH_TERM = "ship";

/** Input spread over several frames, eased between `from` and `to`. */
interface Gesture {
  from: number;
  to: number;
  /** Called once per frame with the eased progress of this frame. */
  step: (delta: number, first: boolean) => void;
  easing?: (t: number) => number;
}

const renderer = () => main.find(".react-flow__renderer");

function flowZoom() {
  const viewport = main.find(".react-flow__viewport");
  const match = viewport && /scale\(([\d.]+)\)/.exec(viewport.style.transform);
  return match ? Number(match[1]) : 1;
}

/** Point of `element` in the renderer's own (unscaled) coordinates. */
function inRenderer(element: Element | null, fx = 0.5, fy = 0.5): Point {
  const pane = renderer();
  if (!pane || !element) return { x: 0, y: 0 };
  const box = pane.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const scale = box.width / pane.offsetWidth;
  return {
    x: (rect.left + rect.width * fx - box.left) / scale,
    y: (rect.top + rect.height * fy - box.top) / scale,
  };
}

/** Mouse wheel over the canvas: zooms with Ctrl (pinch), pans otherwise. */
function wheel(deltaY: number, ctrlKey: boolean, at: Point) {
  const pane = renderer();
  if (!pane || deltaY === 0) return;
  const box = pane.getBoundingClientRect();
  pane.dispatchEvent(
    new WheelEvent("wheel", {
      deltaY,
      deltaMode: 0,
      ctrlKey,
      clientX: box.left + at.x,
      clientY: box.top + at.y,
      bubbles: true,
      cancelable: true,
    }),
  );
}

const gestures = (() => {
  let anchor: Point = { x: 0, y: 0 };
  let zoomSteps = 0;
  return [
    // Pinch-zoom towards the top of the workflow
    {
      from: T.layout + 400,
      to: T.layout + 1700,
      easing: ease.inOutCubic,
      step: (delta, first) => {
        if (first) {
          anchor = inRenderer(main.node("ValidateOrder"), 0.5, 0.2);
          zoomSteps = Math.log2(0.98 / flowZoom());
        }
        wheel(-(zoomSteps * delta) / 0.002, true, anchor);
      },
    },
    // Scroll down through it
    {
      from: T.layout + 1900,
      to: T.groups - 300,
      easing: ease.inOutCubic,
      step: (delta) => wheel(2 * 820 * delta, false, anchor),
    },
    // Pinch-zoom into the expanded groups
    {
      from: T.groups + 2400,
      to: T.groups + 3700,
      easing: ease.inOutCubic,
      step: (delta, first) => {
        if (first) {
          anchor = inRenderer(main.node("FulfillOrder"), 0.75, 1.15);
          zoomSteps = Math.log2(0.95 / flowZoom());
        }
        wheel(-(zoomSteps * delta) / 0.002, true, anchor);
      },
    },
    // Pinch-zoom into the horizontal layout
    {
      from: T.direction + 1700,
      to: T.direction + 3000,
      easing: ease.inOutCubic,
      step: (delta, first) => {
        const pane = renderer();
        if (first && pane) {
          anchor = { x: pane.offsetWidth / 2, y: pane.offsetHeight / 2 + 20 };
          zoomSteps = Math.log2(1.3);
        }
        wheel(-(zoomSteps * delta) / 0.002, true, anchor);
      },
    },
  ] satisfies Gesture[];
})();

const panelLink = (name: string) =>
  Array.from(
    main.panel()?.querySelectorAll<HTMLElement>(".asl-link") ?? [],
  ).find((link) => link.textContent?.includes(name)) ?? null;

const cues: Cue[] = [
  // Hidden tiles show their groups expanded, like the main window
  ...tileIds.map((id) => ({
    at: 400,
    run: () => click(within(id).button("Expand all groups")),
  })),
  { at: T.reveal - 100, run: () => revealGraph(main.root()) },
  {
    at: T.groups + 850,
    run: () => click(main.button("Fit workflow to view")),
    click: true,
  },
  {
    at: T.groups + 1750,
    run: () => click(main.button("Expand all groups")),
    click: true,
  },
  { at: T.search + 1100, run: () => main.search()?.focus(), click: true },
  ...typing(T.search + 1450, SEARCH_TERM, 150),
  { at: T.search + 3300, run: () => pressKey(main.search(), "Enter") },
  { at: T.search + 4700, run: () => pressKey(main.search(), "Escape") },
  { at: T.search + 4900, run: () => main.search()?.blur() },
  {
    at: T.details + 900,
    run: () => click(main.node("IsSuspicious")),
    click: true,
  },
  {
    at: T.details + 4200,
    run: () => click(panelLink("ManualReview")),
    click: true,
  },
  {
    at: T.themes - 200,
    run: () => click(main.button("Close details")),
    click: true,
  },
  {
    at: T.themes + 650,
    run: () => click(main.button("Fit workflow to view")),
    click: true,
  },
  {
    at: T.themes + 1450,
    run: () => click(main.button("Switch to light theme")),
    click: true,
  },
  {
    at: T.direction + 900,
    run: () => click(main.button("Switch to horizontal layout")),
    click: true,
  },
];

/* ------------------------------------------------------------------ */
/* Cursor                                                              */
/* ------------------------------------------------------------------ */

interface CursorStep {
  at: number;
  duration: number;
  /** Target in window coordinates (unaffected by the camera). */
  target: () => Point | null;
}

/** Point of an element in the main window's own coordinates. */
function local(element: Element | null, fx = 0.5, fy = 0.5): Point | null {
  const root = main.root();
  if (!element || !root) return null;
  const frame = root.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const scale = frame.width / W;
  return {
    x: (rect.left + rect.width * fx - frame.left) / scale,
    y: (rect.top + rect.height * fy - frame.top) / scale,
  };
}

const toFrame = (point: Point, pose: Pose): Point => ({
  x: pose.x + point.x * pose.s,
  y: pose.y + point.y * pose.s,
});

const cursorSteps: CursorStep[] = [
  {
    at: T.groups + 200,
    duration: 600,
    target: () => local(main.button("Fit workflow to view")),
  },
  {
    at: T.groups + 1150,
    duration: 550,
    target: () =>
      local(
        main.button("Expand all groups") ?? main.button("Collapse all groups"),
      ),
  },
  {
    at: T.search + 300,
    duration: 800,
    target: () => local(main.search(), 0.35, 0.55),
  },
  {
    at: T.search + 1500,
    duration: 700,
    target: () => local(main.search(), 0.55, 1.9),
  },
  {
    at: T.details + 100,
    duration: 750,
    target: () => local(main.node("IsSuspicious"), 0.62, 0.55),
  },
  {
    at: T.details + 3300,
    duration: 800,
    target: () => local(panelLink("ManualReview"), 0.5, 0.6),
  },
  {
    at: T.themes - 900,
    duration: 650,
    target: () => local(main.button("Close details")),
  },
  {
    at: T.themes + 100,
    duration: 500,
    target: () => local(main.button("Fit workflow to view")),
  },
  {
    at: T.themes + 900,
    duration: 500,
    target: () => local(main.button("Switch to light theme")),
  },
  {
    at: T.direction + 100,
    duration: 750,
    target: () => local(main.button("Switch to horizontal layout")),
  },
  {
    at: T.direction + 1300,
    duration: 1200,
    target: () => ({ x: 1150, y: 760 }),
  },
];

const clickTimes = cues.filter((cue) => cue.click).map((cue) => cue.at);

const cursorVisible = (t: number) =>
  Math.max(
    envelope(t, T.groups + 100, T.themes + 2300, 300, 300),
    envelope(t, T.direction - 100, T.direction + 2900, 300, 300),
  );

const Cursor: React.FC<{ t: number; pose: Pose }> = ({ t, pose }) => {
  const state = useRef<{ index: number; from: Point; last: Point }>({
    index: -1,
    from: { x: 1500, y: 1000 },
    last: { x: 1500, y: 1000 },
  });
  const opacity = cursorVisible(t);

  let position = state.current.last;
  for (let i = cursorSteps.length - 1; i >= 0; i--) {
    const step = cursorSteps[i];
    if (t < step.at) continue;
    if (state.current.index !== i) {
      state.current.index = i;
      state.current.from = state.current.last;
    }
    const target = step.target();
    if (target) {
      const to = toFrame(target, pose);
      const amount = ease.inOutCubic(progress(t, step.at, step.duration));
      position = {
        x: lerp(state.current.from.x, to.x, amount),
        y: lerp(state.current.from.y, to.y, amount),
      };
    }
    break;
  }
  state.current.last = position;

  const press = clickTimes.reduce((value, at) => {
    const p = progress(t, at - 90, 260);
    return p > 0 && p < 1 ? Math.max(value, Math.sin(p * Math.PI)) : value;
  }, 0);
  const ripples = clickTimes.filter((at) => t >= at && t < at + 650);

  if (opacity <= 0) return null;
  return (
    <div className="cursor-layer" style={{ opacity }}>
      {ripples.map((at) => {
        const p = ease.outCubic(progress(t, at, 650));
        return (
          <span
            key={at}
            className="ripple"
            style={{
              left: position.x,
              top: position.y,
              width: 18 + 70 * p,
              height: 18 + 70 * p,
              opacity: 0.55 * (1 - p),
            }}
          />
        );
      })}
      <svg
        className="cursor"
        style={{
          transform: `translate(${position.x - 4}px, ${position.y - 3}px) scale(${1 - press * 0.16})`,
        }}
        width="34"
        height="40"
        viewBox="0 0 17 20"
        aria-hidden
      >
        <path
          d="M1.5 1.2 L1.5 16.2 L5.3 12.6 L7.9 18.4 L10.6 17.2 L8.1 11.6 L13.4 11.6 Z"
          fill="#fff"
          stroke="#0b0f19"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Captions                                                            */
/* ------------------------------------------------------------------ */

interface Caption {
  start: number;
  end: number;
  eyebrow: string;
  title: string;
}

const captions: Caption[] = [
  {
    start: T.code + 200,
    end: T.center + 300,
    eyebrow: "Drop-in React component",
    title: "One component. Your whole state machine.",
  },
  {
    start: T.layout,
    end: T.groups - 100,
    eyebrow: "Smart layout",
    title: "Service-aware states, clean orthogonal routing.",
  },
  {
    start: T.groups,
    end: T.search - 300,
    eyebrow: "Parallel & Map",
    title: "Expand groups inline, with animated re-layout.",
  },
  {
    start: T.search - 200,
    end: T.details - 300,
    eyebrow: "Search",
    title: "Find any state, even nested ones.",
  },
  {
    start: T.details - 200,
    end: T.themes - 300,
    eyebrow: "Details panel",
    title: "Choice rules, retries, catches and data flow.",
  },
  {
    start: T.themes - 200,
    end: T.direction - 300,
    eyebrow: "Themes",
    title: "Light, dark, high contrast, soft. Or your own.",
  },
  {
    start: T.direction - 200,
    end: T.bento - 200,
    eyebrow: "Layouts",
    title: "Top-to-bottom or left-to-right.",
  },
  {
    start: T.bento,
    end: T.outro - 200,
    eyebrow: "And much more",
    title: "Built for real-world workflows.",
  },
];

const CaptionView: React.FC<{ t: number; caption: Caption }> = ({
  t,
  caption,
}) => {
  const { start, end, eyebrow, title } = caption;
  if (t < start || t > end) return null;
  const local = t - start;
  const exit = ease.inCubic(progress(t, end - 350, 350));
  const words = title.split(" ");
  return (
    <div
      className="caption"
      style={{ opacity: 1 - exit, transform: `translateY(${-14 * exit}px)` }}
    >
      <div
        className="caption__eyebrow"
        style={{
          opacity: ease.outCubic(progress(local, 0, 500)),
          transform: `translateY(${tween(local, 0, 600, 10, 0, ease.outExpo)}px)`,
        }}
      >
        {eyebrow}
      </div>
      <h2 className="caption__title">
        {words.map((word, index) => {
          const p = ease.outExpo(progress(local, 80 + index * 45, 750));
          return (
            <span className="word" key={index}>
              <span
                style={{
                  transform: `translateY(${(1 - p) * 105}%)`,
                  opacity: p,
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </h2>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Callouts on the graph                                               */
/* ------------------------------------------------------------------ */

interface Callout {
  node: string;
  side: "left" | "right";
  text: string;
  color: string;
  delay: number;
}

const callouts: Callout[] = [
  {
    node: "ValidateOrder",
    side: "right",
    text: "Retry + Catch",
    color: "#F28C28",
    delay: 1500,
  },
  {
    node: "ScreenForFraud",
    side: "left",
    text: "Amazon Bedrock",
    color: "#5BC0EB",
    delay: 1700,
  },
  {
    node: "IsSuspicious",
    side: "right",
    text: "Readable choice rules",
    color: "#F5B83D",
    delay: 1900,
  },
  {
    node: "ManualReview",
    side: "left",
    text: "SQS · wait for callback",
    color: "#E7157B",
    delay: 2100,
  },
  {
    node: "NotifyFailure",
    side: "left",
    text: "Catch → error path",
    color: "#F87171",
    delay: 2300,
  },
  {
    node: "ShipItems",
    side: "right",
    text: "Map & Parallel groups",
    color: "#A3E635",
    delay: 2500,
  },
];

const Callouts: React.FC<{ t: number; pose: Pose }> = ({ t, pose }) => {
  const start = T.layout;
  const end = T.groups + 200;
  if (t < start || t > end) return null;
  return (
    <div className="callouts">
      {callouts.map((callout) => {
        const element = main.node(callout.node);
        const anchor = local(element, callout.side === "right" ? 1 : 0, 0.5);
        if (!anchor) return null;
        const onScreen =
          clamp((anchor.y - 150) / 70) * clamp((800 - anchor.y) / 70);
        const a =
          envelope(t, start + callout.delay, end, 500, 300, ease.outExpo) *
          ease.outCubic(onScreen);
        if (a <= 0.001) return null;
        const at = toFrame(anchor, pose);
        const reach = 44 * a;
        const side = callout.side === "right" ? "left" : "right";
        return (
          <div
            key={callout.node}
            className="callout"
            style={{
              left: at.x,
              top: at.y,
              opacity: a,
              ["--c" as string]: callout.color,
            }}
          >
            <span className="callout__dot" />
            <span
              className="callout__line"
              style={{ [side]: 0, width: reach }}
            />
            <span
              className="callout__pill"
              style={{
                [side]: reach + 6,
                transform: `translateY(-50%) scale(${0.85 + 0.15 * a})`,
                transformOrigin:
                  side === "left" ? "left center" : "right center",
              }}
            >
              {callout.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Windows                                                             */
/* ------------------------------------------------------------------ */

const AppWindow: React.FC<{
  id: string;
  title: string;
  pose: Pose;
  opacity: number;
  className?: string;
  children: React.ReactNode;
}> = ({ id, title, pose, opacity, className, children }) => (
  <div
    id={id}
    className={`window ${className ?? ""}`}
    style={{
      transform: `translate(${pose.x}px, ${pose.y}px) scale(${pose.s})`,
      opacity,
      visibility: opacity <= 0 ? "hidden" : undefined,
    }}
  >
    <div className="window__bar">
      <span className="dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="window__title">{title}</span>
    </div>
    <div className="window__body">{children}</div>
  </div>
);

const viewer = (theme: ThemeName) => (
  <WorkflowViewer
    definition={orderWorkflow}
    theme={theme}
    width={W}
    height={H - BAR}
    showToolbar
  />
);

const TILES: {
  id: string;
  theme: ThemeName;
  label: string;
  pose: Pose;
  from: Pose;
  delay: number;
}[] = [
  {
    id: "tile-dark",
    theme: "dark",
    label: "dark",
    pose: tile(1, 0),
    from: { ...tile(1, 0), x: 1960 },
    delay: 0,
  },
  {
    id: "tile-contrast",
    theme: "highContrast",
    label: "highContrast",
    pose: tile(0, 1),
    from: { ...tile(0, 1), y: 1120 },
    delay: 140,
  },
  {
    id: "tile-soft",
    theme: "soft",
    label: "soft",
    pose: tile(1, 1),
    from: { ...tile(1, 1), x: 1960, y: 1120 },
    delay: 280,
  },
];

const TileLabels: React.FC<{ t: number; pose: Pose; tilePoses: Pose[] }> = ({
  t,
  pose,
  tilePoses,
}) => {
  const a = envelope(
    t,
    T.themes + 3300,
    T.direction - 1000,
    500,
    300,
    ease.outExpo,
  );
  if (a <= 0) return null;
  const labels = [
    { name: "light", pose },
    ...TILES.map((item, index) => ({
      name: item.label,
      pose: tilePoses[index],
    })),
  ];
  return (
    <>
      {labels.map(({ name, pose: at }, index) => {
        const p = ease.outBack(progress(t, T.themes + 3300 + index * 110, 500));
        return (
          <span
            key={name}
            className="tile-label"
            style={{
              left: at.x + 18,
              top: at.y + (H - 18) * at.s,
              opacity: a,
              transform: `translateY(-100%) scale(${0.7 + 0.3 * p})`,
            }}
          >
            theme=<b>&quot;{name}&quot;</b>
          </span>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Background                                                          */
/* ------------------------------------------------------------------ */

/**
 * Static on purpose: a background that never moves keeps the README GIF
 * small, since only the regions that change are encoded in each frame.
 */
const Background: React.FC = () => (
  <div className="bg">
    <div className="glow glow--a" />
    <div className="glow glow--b" />
    <div className="grid" />
  </div>
);

/** Orthogonal "edges" drawing themselves behind the intro and outro. */
const Traces: React.FC<{ t: number; start: number; opacity: number }> = ({
  t,
  start,
  opacity,
}) => {
  const paths = [
    "M -20 210 H 260 Q 280 210 280 230 V 420 Q 280 440 300 440 H 520",
    "M 1940 160 H 1660 Q 1640 160 1640 180 V 360 Q 1640 380 1620 380 H 1420",
    "M -20 960 H 180 Q 200 960 200 940 V 840 Q 200 820 220 820 H 470",
    "M 1940 1000 H 1720 Q 1700 1000 1700 980 V 840 Q 1700 820 1680 820 H 1460",
    "M 640 -20 V 90 Q 640 110 660 110 H 820",
    "M 1300 1100 V 1010 Q 1300 990 1280 990 H 1100",
  ];
  const nodes: [number, number, string][] = [
    [520, 440, "#F28C28"],
    [1420, 380, "#5BC0EB"],
    [470, 820, "#E7157B"],
    [1460, 820, "#A3E635"],
    [820, 110, "#8B5CF6"],
    [1100, 990, "#22C55E"],
  ];
  return (
    <svg className="traces" width="1920" height="1080" style={{ opacity }}>
      {paths.map((d, index) => {
        const p = ease.inOutCubic(progress(t, start + index * 110, 1300));
        return (
          <path
            key={index}
            d={d}
            pathLength={100}
            style={{ strokeDasharray: 100, strokeDashoffset: 100 * (1 - p) }}
          />
        );
      })}
      {nodes.map(([x, y, color], index) => {
        const p = ease.outBack(progress(t, start + 900 + index * 110, 500));
        return (
          <rect
            key={index}
            x={x - 46 * p}
            y={y - 14 * p}
            width={92 * p}
            height={28 * p}
            rx={7}
            fill="#0E1422"
            stroke={color}
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Intro, feature grid and outro                                       */
/* ------------------------------------------------------------------ */

const Intro: React.FC<{ t: number }> = ({ t }) => {
  if (t > T.code + 400) return null;
  const exit = ease.inCubic(progress(t, T.code - 500, 700));
  const title = "ASL Viewer";
  return (
    <div
      className="intro"
      style={{
        opacity: 1 - exit,
        transform: `scale(${1 + exit * 0.08}) translateY(${-30 * exit}px)`,
      }}
    >
      <div
        className="intro__mark"
        style={{
          transform: `translateY(${tween(t, 150, 1200, 30, 0, ease.outExpo)}px)`,
        }}
      >
        <LogoMark
          t={t - 150}
          size={190}
          spin={tween(t, 150, 3200, -40, 0, ease.outExpo)}
        />
      </div>
      <h1 className="intro__title">
        {Array.from(title).map((char, index) => {
          const p = ease.outExpo(progress(t, 700 + index * 40, 900));
          return (
            <span className="word" key={index}>
              <span
                className={index < 3 ? "accent" : undefined}
                style={{ transform: `translateY(${(1 - p) * 110}%)` }}
              >
                {char === " " ? " " : char}
              </span>
            </span>
          );
        })}
      </h1>
      <p
        className="intro__tagline"
        style={{
          opacity: ease.outCubic(progress(t, 1450, 700)),
          transform: `translateY(${tween(t, 1450, 900, 16, 0, ease.outExpo)}px)`,
        }}
      >
        AWS Step Functions workflows, beautifully rendered in React.
      </p>
      <div className="intro__chips">
        {["Open source", "TypeScript", "React 17+"].map((chip, index) => {
          const p = ease.outBack(progress(t, 1900 + index * 120, 600));
          return (
            <span
              key={chip}
              className="chip"
              style={{
                opacity: clamp(p),
                transform: `scale(${0.8 + 0.2 * p})`,
              }}
            >
              {chip}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const FEATURES = [
  {
    icon: IconFileCode,
    title: "JSON, YAML, URLs & files",
    text: "Pass an object, a string, a URL or a File.",
    color: "#5BC0EB",
  },
  {
    icon: IconBrandAws,
    title: "CloudFormation & SAM",
    text: "Definition, DefinitionString, !Sub and Fn::Join.",
    color: "#F28C28",
  },
  {
    icon: IconBraces,
    title: "Modern ASL",
    text: "JSONata, Distributed Map, nested executions.",
    color: "#C084FC",
  },
  {
    icon: IconShieldCheck,
    title: "Validation built in",
    text: "Syntax and semantics, nested branches included.",
    color: "#4ADE80",
  },
  {
    icon: IconKeyboard,
    title: "Accessible",
    text: "Keyboard navigation, ARIA labels, reduced motion.",
    color: "#F5B83D",
  },
  {
    icon: IconPalette,
    title: "Themeable",
    text: "Theme objects and CSS variables, no re-render.",
    color: "#F472B6",
  },
  {
    icon: IconBolt,
    title: "Fast",
    text: "Hundreds of states laid out in milliseconds.",
    color: "#FACC15",
  },
  {
    icon: IconBrandTypescript,
    title: "Fully typed",
    text: "First-class TypeScript types and utilities.",
    color: "#60A5FA",
  },
];

const Bento: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.bento - 100 || t > T.outro + 100) return null;
  const exit = ease.inCubic(progress(t, T.outro - 450, 450));
  return (
    <div
      className="bento"
      style={{ opacity: 1 - exit, transform: `scale(${1 - exit * 0.04})` }}
    >
      {FEATURES.map((feature, index) => {
        const column = index % 4;
        const row = Math.floor(index / 4);
        const start = T.bento + 200 + (column + row * 2) * 90;
        const p = ease.outExpo(progress(t, start, 900));
        const Icon = feature.icon;
        return (
          <div
            key={feature.title}
            className="card"
            style={{
              opacity: clamp(p * 1.4),
              transform: `translateY(${(1 - p) * 60}px) scale(${0.92 + 0.08 * p})`,
              ["--c" as string]: feature.color,
            }}
          >
            <span className="card__icon">
              <Icon size={30} stroke={1.8} />
            </span>
            <div className="card__title">{feature.title}</div>
            <div className="card__text">{feature.text}</div>
          </div>
        );
      })}
    </div>
  );
};

const INSTALL = "npm install asl-viewer";

const Outro: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.outro - 100) return null;
  const local = t - T.outro;
  const typed = Math.floor(clamp((local - 1100) / 700) * INSTALL.length);
  const fadeOut = ease.inCubic(progress(t, T.end - 600, 600));
  return (
    <div className="outro" style={{ opacity: 1 - fadeOut }}>
      <div className="outro__brand">
        <div
          style={{
            transform: `scale(${tween(local, 0, 900, 0.6, 1, ease.outBack)})`,
            opacity: clamp(local / 300),
          }}
        >
          <LogoMark t={local} size={132} />
        </div>
        <h1 className="outro__title">
          {Array.from("ASL Viewer").map((char, index) => {
            const p = ease.outExpo(progress(local, 350 + index * 35, 800));
            return (
              <span className="word" key={index}>
                <span
                  className={index < 3 ? "accent" : undefined}
                  style={{ transform: `translateY(${(1 - p) * 110}%)` }}
                >
                  {char === " " ? " " : char}
                </span>
              </span>
            );
          })}
        </h1>
      </div>
      <div
        className="install"
        style={{
          opacity: ease.outCubic(progress(local, 850, 500)),
          transform: `translateY(${tween(local, 850, 800, 20, 0, ease.outExpo)}px)`,
        }}
      >
        <span className="install__prompt">$</span>
        <span>{INSTALL.slice(0, typed)}</span>
        <span
          className="caret"
          style={{
            opacity:
              Math.floor(local / 500) % 2 === 0 || typed < INSTALL.length
                ? 1
                : 0,
          }}
        />
        <span className="install__copy">
          <IconCopy size={22} stroke={1.8} />
        </span>
      </div>
      <div className="outro__links">
        {[
          {
            icon: IconBrandGithub,
            text: "github.com/cleissonbarbosa/asl-viewer",
          },
          { icon: IconBook2, text: "cleissonbarbosa.github.io/asl-viewer" },
        ].map((link, index) => {
          const p = ease.outExpo(progress(local, 1900 + index * 150, 800));
          const Icon = link.icon;
          return (
            <span
              key={link.text}
              className="link"
              style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}
            >
              <Icon size={22} stroke={1.8} />
              {link.text}
            </span>
          );
        })}
      </div>
      <p
        className="outro__footer"
        style={{ opacity: ease.outCubic(progress(local, 2500, 700)) }}
      >
        Open source · Apache-2.0 · React 17+
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

export const Promo: React.FC<{ t: number }> = ({ t }) => {
  const camera = useMemo(
    () => new Track({ ...RIGHT, y: RIGHT.y + 90 }, cameraMoves),
    [],
  );
  const tileTracks = useMemo(
    () =>
      TILES.map(
        (item) =>
          new Track(item.from, [
            {
              at: T.themes + 2700 + item.delay,
              duration: 1100,
              to: item.pose,
              easing: ease.outExpo,
            },
            {
              at: T.direction - 1100 + item.delay / 2,
              duration: 800,
              to: item.from,
              easing: ease.inCubic,
            },
          ]),
      ),
    [],
  );

  // Simulated input runs after the frame is committed
  const fired = useRef(new Set<number>());
  const previous = useRef(-1);
  useLayoutEffect(() => {
    cues.forEach((cue, index) => {
      if (t >= cue.at && !fired.current.has(index)) {
        fired.current.add(index);
        cue.run();
      }
    });
    const before = previous.current;
    previous.current = t;
    gestures.forEach((gesture: Gesture) => {
      if (t < gesture.from || before > gesture.to) return;
      const easing = gesture.easing ?? ease.linear;
      const span = gesture.to - gesture.from;
      const now = easing(progress(t, gesture.from, span));
      const last =
        before < gesture.from
          ? 0
          : easing(progress(before, gesture.from, span));
      gesture.step(now - last, before < gesture.from);
    });
  }, [t]);

  // The viewers never re-render because of the clock
  const mainViewer = useMemo(() => viewer("dark"), []);
  const tileViewers = useMemo(
    () => TILES.map((item) => viewer(item.theme)),
    [],
  );

  const pose = camera.at(t);
  const mainOpacity = Math.min(
    ease.outCubic(progress(t, T.code + 300, 700)),
    1 - ease.inCubic(progress(t, T.bento - 500, 600)),
  );

  return (
    <div className="stage">
      <Background />
      <Traces
        t={t}
        start={100}
        opacity={1 - ease.inCubic(progress(t, T.code - 400, 600))}
      />
      <Traces t={t} start={T.outro + 200} opacity={t > T.outro ? 1 : 0} />

      <Intro t={t} />

      <div
        className="code-wrap"
        style={{
          opacity: envelope(t, T.code + 200, T.center + 250, 600, 500),
          transform: `translate(${tween(t, T.code + 200, 1100, -60, 0, ease.outExpo) + tween(t, T.center - 250, 600, 0, -80, ease.inCubic)}px, 0)`,
        }}
      >
        <CodeCard t={t - T.typing} />
      </div>

      {TILES.map((item, index) => {
        const tilePose = tileTracks[index].at(t);
        const visible = t > T.themes + 2600 && t < T.direction + 200;
        return (
          <AppWindow
            key={item.id}
            id={item.id}
            title="order-fulfillment.asl.json"
            pose={visible ? tilePose : { x: 0, y: 0, s: 1 }}
            opacity={visible ? 1 : 0}
            className="window--tile"
          >
            {tileViewers[index]}
          </AppWindow>
        );
      })}

      <AppWindow
        id="main-window"
        title="order-fulfillment.asl.json"
        pose={pose}
        opacity={mainOpacity}
        className={
          t < T.reveal ? "prereveal" : t < T.reveal + 2400 ? "reveal" : ""
        }
      >
        {mainViewer}
      </AppWindow>

      <TileLabels
        t={t}
        pose={pose}
        tilePoses={tileTracks.map((track) => track.at(t))}
      />
      <Callouts t={t} pose={pose} />

      <div
        className="scrim"
        style={{ opacity: t > T.code && t < T.bento + 200 ? 1 : 0 }}
      />
      {captions.map((caption) => (
        <CaptionView key={caption.start} t={t} caption={caption} />
      ))}

      <Bento t={t} />
      <Outro t={t} />
      <Cursor t={t} pose={pose} />
    </div>
  );
};
