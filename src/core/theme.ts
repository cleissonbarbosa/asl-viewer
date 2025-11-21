import { ThemeName, ViewerTheme } from "../types";

/**
 * Modern Light Theme - Clean and professional with subtle shadows
 */
export const lightTheme: ViewerTheme = {
  name: "light",
  background: "#f8f9fa", // Lighter gray background
  surfaceColor: "#ffffff",
  overlayColor: "rgba(255, 255, 255, 0.95)",

  nodeColors: {
    pass: "#ffffff",
    task: "#ffffff",
    choice: "#ffffff",
    wait: "#ffffff",
    succeed: "#f0fdf4", // Subtle green tint
    fail: "#fef2f2", // Subtle red tint
    parallel: "#ffffff",
    map: "#ffffff",
  },

  nodeBorderColors: {
    pass: "#e2e8f0", // Slate 200
    task: "#3b82f6", // Blue 500
    choice: "#f59e0b", // Amber 500
    wait: "#8b5cf6", // Violet 500
    succeed: "#22c55e", // Green 500
    fail: "#ef4444", // Red 500
    parallel: "#06b6d4", // Cyan 500
    map: "#84cc16", // Lime 500
  },

  nodeHoverColors: {
    pass: "#f8fafc",
    task: "#eff6ff",
    choice: "#fffbeb",
    wait: "#f5f3ff",
    succeed: "#dcfce7",
    fail: "#fee2e2",
    parallel: "#ecfeff",
    map: "#f7fee7",
  },

  textColor: "#1e293b", // Slate 800
  textColorSecondary: "#64748b", // Slate 500
  textColorMuted: "#94a3b8", // Slate 400

  borderColor: "#e2e8f0",
  borderColorHover: "#cbd5e1",

  connectionColor: "#94a3b8",
  connectionHoverColor: "#475569",
  connectionLabelColor: "#64748b",

  startNodeColor: "#22c55e",
  endNodeColor: "#ef4444",
  selectedNodeColor: "#3b82f6",

  shadowColor: "rgba(0, 0, 0, 0.05)", // Much softer shadow

  errorColor: "#ef4444",
  warningColor: "#f59e0b",
  infoColor: "#3b82f6",
  successColor: "#22c55e",

  gridColor: "#e2e8f0",
  miniMapBackground: "#ffffff",
  controlsBackground: "#ffffff",
  tooltipBackground: "#1e293b",
  tooltipTextColor: "#ffffff",
};

/**
 * Modern Dark Theme - Sleek and elegant with high contrast
 */
export const darkTheme: ViewerTheme = {
  name: "dark",
  background: "#0f172a", // Slate 900
  surfaceColor: "#1e293b", // Slate 800
  overlayColor: "rgba(15, 23, 42, 0.95)",

  nodeColors: {
    pass: "#1e293b",
    task: "#1e293b",
    choice: "#1e293b",
    wait: "#1e293b",
    succeed: "#064e3b", // Dark green
    fail: "#7f1d1d", // Dark red
    parallel: "#1e293b",
    map: "#1e293b",
  },

  nodeBorderColors: {
    pass: "#334155", // Slate 700
    task: "#3b82f6",
    choice: "#f59e0b",
    wait: "#8b5cf6",
    succeed: "#22c55e",
    fail: "#ef4444",
    parallel: "#06b6d4",
    map: "#84cc16",
  },

  nodeHoverColors: {
    pass: "#334155",
    task: "#1e3a8a",
    choice: "#451a03",
    wait: "#4c1d95",
    succeed: "#065f46",
    fail: "#991b1b",
    parallel: "#155e75",
    map: "#365314",
  },

  textColor: "#f8fafc", // Slate 50
  textColorSecondary: "#cbd5e1", // Slate 300
  textColorMuted: "#64748b", // Slate 500

  borderColor: "#334155",
  borderColorHover: "#475569",

  connectionColor: "#475569",
  connectionHoverColor: "#94a3b8",
  connectionLabelColor: "#94a3b8",

  startNodeColor: "#22c55e",
  endNodeColor: "#ef4444",
  selectedNodeColor: "#3b82f6",

  shadowColor: "rgba(0, 0, 0, 0.3)",

  errorColor: "#ef4444",
  warningColor: "#f59e0b",
  infoColor: "#3b82f6",
  successColor: "#22c55e",

  gridColor: "#1e293b",
  miniMapBackground: "#1e293b",
  controlsBackground: "#1e293b",
  tooltipBackground: "#f8fafc",
  tooltipTextColor: "#0f172a",
};

/**
 * High Contrast Theme - Optimized for accessibility
 */
export const highContrastTheme: ViewerTheme = {
  name: "highContrast",
  background: "#000000",
  surfaceColor: "#1a1a1a",
  overlayColor: "rgba(26, 26, 26, 0.95)",

  nodeColors: {
    pass: "#000080",
    task: "#008000",
    choice: "#ff8c00",
    wait: "#8b008b",
    succeed: "#228b22",
    fail: "#dc143c",
    parallel: "#4682b4",
    map: "#32cd32",
  },

  nodeBorderColors: {
    pass: "#0000ff",
    task: "#00ff00",
    choice: "#ffa500",
    wait: "#ff00ff",
    succeed: "#00ff00",
    fail: "#ff0000",
    parallel: "#00bfff",
    map: "#7fff00",
  },

  nodeHoverColors: {
    pass: "#191970",
    task: "#006400",
    choice: "#ff7f50",
    wait: "#9932cc",
    succeed: "#228b22",
    fail: "#b22222",
    parallel: "#4169e1",
    map: "#228b22",
  },

  textColor: "#ffffff",
  textColorSecondary: "#ffffff",
  textColorMuted: "#cccccc",

  borderColor: "#ffffff",
  borderColorHover: "#ffffff",

  connectionColor: "#ffffff",
  connectionHoverColor: "#ffff00",
  connectionLabelColor: "#ffffff",

  startNodeColor: "#00ff00",
  endNodeColor: "#ff0000",
  selectedNodeColor: "#ffff00",

  shadowColor: "rgba(255, 255, 255, 0.3)",

  errorColor: "#ff0000",
  warningColor: "#ffff00",
  infoColor: "#00ffff",
  successColor: "#00ff00",

  gridColor: "#333333",
  miniMapBackground: "#1a1a1a",
  controlsBackground: "#333333",
  tooltipBackground: "#ffffff",
  tooltipTextColor: "#000000",
};

/**
 * Soft Theme - Gentle colors for extended viewing
 */
export const softTheme: ViewerTheme = {
  name: "soft",
  background: "#f8f9fa",
  surfaceColor: "#ffffff",
  overlayColor: "rgba(255, 255, 255, 0.95)",

  nodeColors: {
    pass: "#e3f2fd",
    task: "#e8f5e8",
    choice: "#fff3e0",
    wait: "#f3e5f5",
    succeed: "#e0f2f1",
    fail: "#fce4ec",
    parallel: "#e0f7fa",
    map: "#f1f8e9",
  },

  nodeBorderColors: {
    pass: "#90caf9",
    task: "#a5d6a7",
    choice: "#ffb74d",
    wait: "#ce93d8",
    succeed: "#81c784",
    fail: "#f48fb1",
    parallel: "#80deea",
    map: "#aed581",
  },

  nodeHoverColors: {
    pass: "#bbdefb",
    task: "#c8e6c9",
    choice: "#ffe0b2",
    wait: "#e1bee7",
    succeed: "#b2dfdb",
    fail: "#f8bbd9",
    parallel: "#b2ebf2",
    map: "#dcedc8",
  },

  textColor: "#37474f",
  textColorSecondary: "#546e7a",
  textColorMuted: "#78909c",

  borderColor: "#e0e0e0",
  borderColorHover: "#bdbdbd",

  connectionColor: "#90a4ae",
  connectionHoverColor: "#546e7a",
  connectionLabelColor: "#607d8b",

  startNodeColor: "#66bb6a",
  endNodeColor: "#ef5350",
  selectedNodeColor: "#42a5f5",

  shadowColor: "rgba(0, 0, 0, 0.1)",

  errorColor: "#e57373",
  warningColor: "#ffb74d",
  infoColor: "#64b5f6",
  successColor: "#81c784",

  gridColor: "#f5f5f5",
  miniMapBackground: "#fafafa",
  controlsBackground: "#ffffff",
  tooltipBackground: "#37474f",
  tooltipTextColor: "#ffffff",
};

/**
 * Get theme by name
 */
export function getTheme(themeName: ThemeName): ViewerTheme {
  switch (themeName) {
    case "dark":
      return darkTheme;
    case "highContrast":
      return highContrastTheme;
    case "soft":
      return softTheme;
    case "light":
    default:
      return lightTheme;
  }
}

/**
 * Get all available themes
 */
export function getAllThemes(): Record<ThemeName, ViewerTheme> {
  return {
    light: lightTheme,
    dark: darkTheme,
    highContrast: highContrastTheme,
    soft: softTheme,
  };
}

/**
 * Get theme names
 */
export function getThemeNames(): ThemeName[] {
  return ["light", "dark", "highContrast", "soft"];
}

/**
 * Create a custom theme based on an existing theme
 */
export function createCustomTheme(
  baseTheme: ThemeName,
  overrides: Partial<
    Omit<ViewerTheme, "nodeColors" | "nodeBorderColors" | "nodeHoverColors"> & {
      nodeColors?: Partial<ViewerTheme["nodeColors"]>;
      nodeBorderColors?: Partial<ViewerTheme["nodeBorderColors"]>;
      nodeHoverColors?: Partial<ViewerTheme["nodeHoverColors"]>;
    }
  >,
): ViewerTheme {
  const base = getTheme(baseTheme);
  return {
    ...base,
    ...overrides,
    nodeColors: {
      ...base.nodeColors,
      ...overrides.nodeColors,
    },
    nodeBorderColors: {
      ...base.nodeBorderColors,
      ...overrides.nodeBorderColors,
    },
    nodeHoverColors: {
      ...base.nodeHoverColors,
      ...overrides.nodeHoverColors,
    },
  };
}
