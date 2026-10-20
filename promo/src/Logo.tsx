import React from "react";
import { ease, progress } from "./motion";

/**
 * The ASL Viewer mark (orbits around a small state machine), drawn in SVG
 * so it stays sharp at any size. `t` is the time since the mark started
 * animating, in milliseconds; a large value shows it fully drawn.
 */
export const LogoMark: React.FC<{ t: number; size: number; spin?: number }> = ({
  t,
  size,
  spin = 0,
}) => {
  const orbit = (index: number) => {
    const p = ease.outCubic(progress(t, index * 120, 900));
    return {
      strokeDasharray: 100,
      strokeDashoffset: 100 * (1 - p),
      opacity: Math.min(1, p * 3),
    };
  };
  const pop = (delay: number) => {
    const p = ease.outBack(progress(t, 350 + delay, 520));
    return {
      transform: `scale(${Math.max(0, p)})`,
      transformBox: "fill-box" as const,
      transformOrigin: "center",
    };
  };
  const draw = (delay: number, length: number) => {
    const p = ease.outCubic(progress(t, 350 + delay, 420));
    return { strokeDasharray: length, strokeDashoffset: length * (1 - p) };
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
    >
      <g
        transform={`rotate(${spin} 60 62)`}
        stroke="#5BC0EB"
        strokeWidth={4.5}
        strokeLinecap="round"
      >
        {[0, 60, 120].map((angle, index) => (
          <ellipse
            key={angle}
            cx={60}
            cy={62}
            rx={53}
            ry={21}
            transform={`rotate(${angle} 60 62)`}
            pathLength={100}
            style={orbit(index)}
          />
        ))}
      </g>
      <g stroke="#1B2333" strokeWidth={2.4} strokeLinecap="round">
        <path d="M60 30 V40" style={draw(80, 10)} />
        <path
          d="M60 56 V71 M34 64 H86 M34 64 V69 M86 64 V69"
          style={draw(200, 80)}
        />
        <path d="M60 85 V91" style={draw(320, 6)} />
      </g>
      <g stroke="#1B2333" strokeWidth={2.4}>
        <rect
          x={51}
          y={13}
          width={18}
          height={18}
          rx={3}
          fill="#F28C28"
          style={pop(0)}
        />
        <rect
          x={51}
          y={40}
          width={18}
          height={18}
          rx={3}
          fill="#F28C28"
          style={pop(110)}
        />
        <rect
          x={25}
          y={69}
          width={18}
          height={18}
          rx={3}
          fill="#F28C28"
          style={pop(230)}
        />
        <rect
          x={77}
          y={69}
          width={18}
          height={18}
          rx={3}
          fill="#F28C28"
          style={pop(270)}
        />
        <circle cx={60} cy={78} r={7.5} fill="#2E86C1" style={pop(250)} />
        <circle cx={60} cy={99} r={7.5} fill="#2E86C1" style={pop(360)} />
      </g>
    </svg>
  );
};
