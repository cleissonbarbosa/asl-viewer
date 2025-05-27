import { ViewerTheme } from "../types";

/**
 * Modern Light Theme - Clean and professional with subtle shadows
 */
export const lightTheme: ViewerTheme = {
  name: "light",
  background: "#fafbfc",
  surfaceColor: "#ffffff",
  overlayColor: "rgba(255, 255, 255, 0.95)",

  nodeColors: {
    pass: "#e8f4fd",
    task: "#f0f9f0",
    choice: "#fff8e1",
    wait: "#f8f4ff",
    succeed: "#e8f5e8",
    fail: "#ffebee",
    parallel: "#e0f7fa",
    map: "#f1f8e9",
  },

  nodeBorderColors: {
    pass: "#2196f3",
    task: "#4caf50",
    choice: "#ff9800",
    wait: "#9c27b0",
    succeed: "#4caf50",
    fail: "#f44336",
    parallel: "#00bcd4",
    map: "#8bc34a",
  },

  nodeHoverColors: {
    pass: "#d4ecfc",
    task: "#e6f5e6",
    choice: "#ffecb3",
    wait: "#ede7f6",
    succeed: "#d4edda",
    fail: "#f5c6cb",
    parallel: "#b2ebf2",
    map: "#dcedc8",
  },

  textColor: "#1a1a1a",
  textColorSecondary: "#4a4a4a",
  textColorMuted: "#757575",

  borderColor: "#e1e4e8",
  borderColorHover: "#c6cbd1",

  connectionColor: "#6a737d",
  connectionHoverColor: "#24292e",
  connectionLabelColor: "#586069",

  startNodeColor: "#28a745",
  endNodeColor: "#dc3545",
  selectedNodeColor: "#0366d6",

  shadowColor: "rgba(27, 31, 35, 0.15)",

  errorColor: "#d73a49",
  warningColor: "#f66a0a",
  infoColor: "#0366d6",
  successColor: "#28a745",

  gridColor: "#f0f0f0",
  miniMapBackground: "#ffffff",
  controlsBackground: "#ffffff",
  tooltipBackground: "#24292e",
  tooltipTextColor: "#ffffff",
};

/**
 * Modern Dark Theme - Sleek and elegant with high contrast
 */
export const darkTheme: ViewerTheme = {
  name: "dark",
  background: "#0d1117",
  surfaceColor: "#161b22",
  overlayColor: "rgba(22, 27, 34, 0.95)",

  nodeColors: {
    pass: "#1f2937",
    task: "#064e3b",
    choice: "#451a03",
    wait: "#581c87",
    succeed: "#064e3b",
    fail: "#7f1d1d",
    parallel: "#164e63",
    map: "#365314",
  },

  nodeBorderColors: {
    pass: "#3b82f6",
    task: "#10b981",
    choice: "#f59e0b",
    wait: "#a855f7",
    succeed: "#10b981",
    fail: "#ef4444",
    parallel: "#06b6d4",
    map: "#84cc16",
  },

  nodeHoverColors: {
    pass: "#374151",
    task: "#065f46",
    choice: "#78350f",
    wait: "#6b21a8",
    succeed: "#065f46",
    fail: "#991b1b",
    parallel: "#0e7490",
    map: "#4d7c0f",
  },

  textColor: "#f0f6fc",
  textColorSecondary: "#c9d1d9",
  textColorMuted: "#8b949e",

  borderColor: "#30363d",
  borderColorHover: "#484f58",

  connectionColor: "#8b949e",
  connectionHoverColor: "#f0f6fc",
  connectionLabelColor: "#c9d1d9",

  startNodeColor: "#22c55e",
  endNodeColor: "#ef4444",
  selectedNodeColor: "#3b82f6",

  shadowColor: "rgba(0, 0, 0, 0.5)",

  errorColor: "#f85149",
  warningColor: "#ff8700",
  infoColor: "#58a6ff",
  successColor: "#3fb950",

  gridColor: "#21262d",
  miniMapBackground: "#161b22",
  controlsBackground: "#21262d",
  tooltipBackground: "#484f58",
  tooltipTextColor: "#f0f6fc",
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
 * Available theme names
 */
export type ThemeName = "light" | "dark" | "highContrast" | "soft";

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
  overrides: Partial<ViewerTheme>,
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
