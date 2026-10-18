import React, { useCallback, useRef } from "react";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconChevronDown,
  IconChevronUp,
  IconFocusCentered,
  IconGridDots,
  IconLayoutDistributeHorizontal,
  IconLayoutDistributeVertical,
  IconMap,
  IconMoon,
  IconSearch,
  IconSun,
  IconX,
  IconZoomIn,
} from "@tabler/icons-react";
import { ThemeName, ViewerTheme } from "../types";
import { classNames } from "./flow-types";

export interface ViewerToolbarProps {
  /** @deprecated Colors come from CSS variables; kept for compatibility. */
  theme?: ViewerTheme;
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
  onSearchPrevious?: () => void;
  /** Number of states matching the search term. */
  searchMatchCount?: number;
  /** Zero-based index of the active match. */
  searchMatchIndex?: number;
  onFitView?: () => void;
  /** Whether the workflow has Parallel / Map groups. */
  hasGroups?: boolean;
  allGroupsExpanded?: boolean;
  onToggleAllGroups?: () => void;
}

export const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  small?: boolean;
  /** @deprecated Colors come from CSS variables. */
  theme?: ViewerTheme;
}> = ({ onClick, isActive, title, children, disabled, small }) => (
  <button
    type="button"
    className={classNames("asl-icon-btn", small && "asl-icon-btn--sm")}
    onClick={onClick}
    title={title}
    aria-label={title}
    aria-pressed={isActive === undefined ? undefined : isActive}
    disabled={disabled}
  >
    {children}
  </button>
);

const DARK_THEMES: ThemeName[] = ["dark", "highContrast"];

/**
 * Floating toolbar with search, layout and display controls.
 */
export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
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
  onSearchPrevious,
  searchMatchCount,
  searchMatchIndex = 0,
  onFitView,
  hasGroups,
  allGroupsExpanded,
  onToggleAllGroups,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = DARK_THEMES.includes(currentThemeName);
  const hasTerm = searchTerm.trim().length > 0;
  const count = searchMatchCount ?? 0;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (event.shiftKey) onSearchPrevious?.();
        else onSearchNext?.();
      } else if (event.key === "Escape") {
        event.stopPropagation();
        if (searchTerm) onSearchChange("");
        else inputRef.current?.blur();
      }
    },
    [onSearchNext, onSearchPrevious, onSearchChange, searchTerm],
  );

  return (
    <div className="asl-toolbar" role="toolbar" aria-label="Workflow tools">
      <div className="asl-search" role="search">
        <IconSearch size={15} aria-hidden />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search states…"
          aria-label="Search states"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
        {hasTerm && searchMatchCount !== undefined && (
          <>
            <span
              className={classNames(
                "asl-search__count",
                count === 0 && "is-empty",
              )}
              aria-live="polite"
            >
              {count === 0
                ? "0/0"
                : `${(searchMatchIndex % count) + 1}/${count}`}
            </span>
            <ToolbarButton
              small
              title="Previous match (Shift+Enter)"
              onClick={() => onSearchPrevious?.()}
              disabled={count < 2 || !onSearchPrevious}
            >
              <IconChevronUp size={14} aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              small
              title="Next match (Enter)"
              onClick={() => onSearchNext?.()}
              disabled={count < 2 || !onSearchNext}
            >
              <IconChevronDown size={14} aria-hidden />
            </ToolbarButton>
          </>
        )}
        {hasTerm && (
          <ToolbarButton
            small
            title="Clear search (Esc)"
            onClick={() => {
              onSearchChange("");
              inputRef.current?.focus();
            }}
          >
            <IconX size={13} aria-hidden />
          </ToolbarButton>
        )}
      </div>

      <span className="asl-toolbar__divider" aria-hidden />

      <ToolbarButton
        onClick={() =>
          onLayoutDirectionChange(layoutDirection === "TB" ? "LR" : "TB")
        }
        title={
          layoutDirection === "TB"
            ? "Switch to horizontal layout"
            : "Switch to vertical layout"
        }
      >
        {layoutDirection === "TB" ? (
          <IconLayoutDistributeHorizontal size={18} aria-hidden />
        ) : (
          <IconLayoutDistributeVertical size={18} aria-hidden />
        )}
      </ToolbarButton>

      {hasGroups && onToggleAllGroups && (
        <ToolbarButton
          onClick={onToggleAllGroups}
          title={
            allGroupsExpanded ? "Collapse all groups" : "Expand all groups"
          }
        >
          {allGroupsExpanded ? (
            <IconArrowsMinimize size={18} aria-hidden />
          ) : (
            <IconArrowsMaximize size={18} aria-hidden />
          )}
        </ToolbarButton>
      )}

      {onFitView && (
        <ToolbarButton onClick={onFitView} title="Fit workflow to view">
          <IconFocusCentered size={18} aria-hidden />
        </ToolbarButton>
      )}

      <span className="asl-toolbar__divider" aria-hidden />

      <ToolbarButton
        isActive={showMiniMap}
        onClick={onToggleMiniMap}
        title="Toggle minimap"
      >
        <IconMap size={18} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        isActive={showControls}
        onClick={onToggleControls}
        title="Toggle zoom controls"
      >
        <IconZoomIn size={18} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        isActive={showBackground}
        onClick={onToggleBackground}
        title="Toggle background grid"
      >
        <IconGridDots size={18} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onThemeChange(isDark ? "light" : "dark")}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? (
          <IconSun size={18} aria-hidden />
        ) : (
          <IconMoon size={18} aria-hidden />
        )}
      </ToolbarButton>
    </div>
  );
};
