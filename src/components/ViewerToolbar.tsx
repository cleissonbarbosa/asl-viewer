import React, { useState } from "react";
import {
  IconSun,
  IconMoon,
  IconLayoutDistributeVertical,
  IconLayoutDistributeHorizontal,
  IconMap,
  IconZoomIn,
  IconGridDots,
  IconSearch,
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
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchNext?: () => void;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  theme: ViewerTheme;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, theme, title, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    background: isActive ? theme.nodeBorderColors.task : theme.surfaceColor,
    border: `1px solid ${isActive ? theme.nodeBorderColors.task : theme.borderColor}`,
    color: isActive ? "#ffffff" : theme.textColor,
    padding: "8px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: theme.shadowColor ? `0 2px 4px ${theme.shadowColor}` : "none",
    transform: isHovered ? "scale(1.05)" : "scale(1)",
  };

  return (
    <button
      style={baseStyle}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
};

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
  searchTerm,
  onSearchChange,
  onSearchNext,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        zIndex: 10,
        display: "flex",
        gap: "8px",
        backgroundColor: theme.overlayColor,
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(8px)",
        alignItems: "center",
        transition: "all 0.3s ease",
        opacity: 0.9,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: theme.surfaceColor,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: "4px",
          padding: "0 8px",
          marginRight: "8px",
          transition: "border-color 0.2s ease",
        }}
      >
        <IconSearch size={16} color={theme.textColorSecondary} />
        <input
          type="text"
          placeholder="Search states..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSearchNext) {
              onSearchNext();
            }
          }}
          style={{
            border: "none",
            background: "none",
            padding: "8px",
            color: theme.textColor,
            outline: "none",
            width: "150px",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Theme Switcher */}
      <ToolbarButton
        theme={theme}
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
      </ToolbarButton>

      {/* Layout Direction */}
      <ToolbarButton
        theme={theme}
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
      </ToolbarButton>

      {/* MiniMap Toggle */}
      <ToolbarButton
        theme={theme}
        isActive={showMiniMap}
        onClick={onToggleMiniMap}
        title="Toggle MiniMap"
      >
        <IconMap size={20} />
      </ToolbarButton>

      {/* Controls Toggle */}
      <ToolbarButton
        theme={theme}
        isActive={showControls}
        onClick={onToggleControls}
        title="Toggle Controls"
      >
        <IconZoomIn size={20} />
      </ToolbarButton>

      {/* Background Toggle */}
      <ToolbarButton
        theme={theme}
        isActive={showBackground}
        onClick={onToggleBackground}
        title="Toggle Background"
      >
        <IconGridDots size={20} />
      </ToolbarButton>
    </div>
  );
};
