import type React from "react";
import { ViewerTheme } from "../types";

const KIND_VARIABLES: Array<[keyof ViewerTheme["nodeColors"], string]> = [
  ["pass", "pass"],
  ["task", "task"],
  ["stepFunction", "stepfn"],
  ["choice", "choice"],
  ["wait", "wait"],
  ["succeed", "succeed"],
  ["fail", "fail"],
  ["parallel", "parallel"],
  ["map", "map"],
];

const SCALAR_VARIABLES: Array<[keyof ViewerTheme, string]> = [
  ["background", "--asl-bg"],
  ["surfaceColor", "--asl-surface"],
  ["overlayColor", "--asl-overlay"],
  ["textColor", "--asl-text"],
  ["textColorSecondary", "--asl-text-2"],
  ["textColorMuted", "--asl-text-3"],
  ["borderColor", "--asl-border"],
  ["borderColorHover", "--asl-border-hover"],
  ["connectionColor", "--asl-edge"],
  ["connectionHoverColor", "--asl-edge-hover"],
  ["connectionLabelColor", "--asl-edge-label"],
  ["startNodeColor", "--asl-start"],
  ["endNodeColor", "--asl-end"],
  ["selectedNodeColor", "--asl-selected"],
  ["shadowColor", "--asl-shadow"],
  ["errorColor", "--asl-error"],
  ["warningColor", "--asl-warning"],
  ["infoColor", "--asl-info"],
  ["successColor", "--asl-success"],
  ["gridColor", "--asl-grid"],
  ["miniMapBackground", "--asl-minimap-bg"],
  ["controlsBackground", "--asl-controls-bg"],
  ["tooltipBackground", "--asl-tooltip-bg"],
  ["tooltipTextColor", "--asl-tooltip-text"],
  ["fontFamily", "--asl-font-family"],
];

/**
 * Converts a color to `rgba(...)` with the given alpha. Supports hex
 * (#rgb, #rrggbb, #rrggbbaa) and rgb()/rgba(); other values are returned
 * unchanged.
 */
export function withAlpha(color: string | undefined, alpha: number): string {
  if (!color) return `rgba(0, 0, 0, ${alpha})`;
  const rgb = parseColor(color);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : color;
}

function parseColor(color: string): [number, number, number] | null {
  const value = color.trim();
  const hex = value.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      digits = digits
        .slice(0, 3)
        .split("")
        .map((d) => d + d)
        .join("");
    }
    if (digits.length < 6) return null;
    return [
      parseInt(digits.slice(0, 2), 16),
      parseInt(digits.slice(2, 4), 16),
      parseInt(digits.slice(4, 6), 16),
    ];
  }
  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

/**
 * True when the color is dark (relative luminance below 0.4).
 */
export function isDarkColor(color: string | undefined): boolean {
  const rgb = color ? parseColor(color) : null;
  if (!rgb) return false;
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
}

/**
 * Maps a theme to CSS custom properties consumed by `styles.css`.
 * Partial themes are supported: missing values fall back to the defaults
 * declared on `.asl-root`.
 */
export function themeToCssVars(
  theme: Partial<ViewerTheme> | undefined,
): React.CSSProperties {
  const vars: Record<string, string> = {};
  if (!theme) return vars;

  for (const [key, variable] of SCALAR_VARIABLES) {
    const value = theme[key];
    if (typeof value === "string" && value) vars[variable] = value;
  }

  for (const [kind, name] of KIND_VARIABLES) {
    const bg = theme.nodeColors?.[kind];
    const border = theme.nodeBorderColors?.[kind];
    const hover = theme.nodeHoverColors?.[kind];
    if (bg) vars[`--asl-${name}-bg`] = bg;
    if (border) vars[`--asl-${name}-border`] = border;
    if (hover) vars[`--asl-${name}-hover`] = hover;
  }

  if (theme.background) {
    vars.colorScheme = isDarkColor(theme.background) ? "dark" : "light";
  }

  return vars as React.CSSProperties;
}
