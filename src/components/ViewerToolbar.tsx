import React from "react";
import {
  IconSun,
  IconMoon,
  IconLayoutDistributeVertical,
  IconLayoutDistributeHorizontal,
  IconMap,
  IconZoomIn,
  IconGridDots,
} from "@tabler/icons-react";
import { ThemeName, ViewerTheme } from "../types";

interface ViewerToolbarProps {
  theme: ViewerTheme;
  currentThemeName: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  layoutDirection: "TB" | "LR";
  onLayoutDirectionChange: (direction: "TB" | "LR") => void;
  showMiniMap: boolean;
  onToggleMiniMap: () => void;
  showControls: boolean;
  onToggleControls: () => void;
  showBackground: boolean;
  onToggleBackground: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  theme,
  currentThemeName,
  onThemeChange,
  layoutDirection,
  onLayoutDirectionChange,
  showMiniMap,
  onToggleMiniMap,
  showControls,
  onToggleControls,
  showBackground,
  onToggleBackground,
}) => {
  const buttonStyle: React.CSSProperties = {
    background: theme.surfaceColor,
    border: `1px solid ${theme.borderColor}`,
    color: theme.textColor,
    padding: "8px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    boxShadow: theme.shadowColor ? `0 2px 4px ${theme.shadowColor}` : "none",
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: theme.selectedNodeColor,
    color: "#ffffff",
    borderColor: theme.selectedNodeColor,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Theme Switcher */}
      <button
        style={buttonStyle}
        onClick={() =>
          onThemeChange(currentThemeName === "light" ? "dark" : "light")
        }
        title={`Switch to ${currentThemeName === "light" ? "Dark" : "Light"} Theme`}
      >
        {currentThemeName === "light" ? (
          <IconMoon size={20} />
        ) : (
          <IconSun size={20} />
        )}
      </button>

      {/* Layout Direction */}
      <button
        style={buttonStyle}
        onClick={() =>
          onLayoutDirectionChange(layoutDirection === "TB" ? "LR" : "TB")
        }
        title={`Layout: ${layoutDirection === "TB" ? "Vertical" : "Horizontal"}`}
      >
        {layoutDirection === "TB" ? (
          <IconLayoutDistributeVertical size={20} />
        ) : (
          <IconLayoutDistributeHorizontal size={20} />
        )}
      </button>

      {/* MiniMap Toggle */}
      <button
        style={showMiniMap ? activeButtonStyle : buttonStyle}
        onClick={onToggleMiniMap}
        title="Toggle MiniMap"
      >
        <IconMap size={20} />
      </button>

      {/* Controls Toggle */}
      <button
        style={showControls ? activeButtonStyle : buttonStyle}
        onClick={onToggleControls}
        title="Toggle Controls"
      >
        <IconZoomIn size={20} />
      </button>

      {/* Background Toggle */}
      <button
        style={showBackground ? activeButtonStyle : buttonStyle}
        onClick={onToggleBackground}
        title="Toggle Background"
      >
        <IconGridDots size={20} />
      </button>
    </div>
  );
};
