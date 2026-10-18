import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IconAlertTriangle, IconJumpRope } from "@tabler/icons-react";
import {
  WorkflowViewerProps,
  StateNode,
  ValidationError,
  ASLDefinition,
  ThemeName,
} from "../types";
import { validateASLDefinition } from "../core/validation";
import { createGraphLayout, createSimpleLayout } from "../core/layout";
import { getTheme } from "../core/theme";
import { getItemProcessor } from "../core/asl-utils";
import {
  loadFromURL,
  loadFromFile,
  parseDefinitionString,
} from "../core/loader";
import {
  ReactFlowRenderer,
  ReactFlowRendererHandle,
} from "./ReactFlowRenderer";
import { ErrorDisplay } from "./ErrorDisplay";
import { ViewerToolbar } from "./ViewerToolbar";
import { DetailPanel } from "./DetailPanel";
import { findSearchMatches } from "./search";
import { isDarkColor, themeToCssVars } from "./theme-vars";
import { classNames } from "./flow-types";
import "../styles.css";

/** Height covered by the floating toolbar. */
const TOOLBAR_INSET = 60;
/** Width covered by the details panel. */
const PANEL_INSET = 380;

/**
 * Keeps the latest value in a ref, so effects can call user callbacks
 * without re-running when an inline callback changes identity.
 */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * Stable key for a definition: equal definitions passed as new object
 * literals on every render do not trigger re-parsing and re-layout.
 */
function definitionKey(definition: ASLDefinition | string | null): string {
  if (definition === null) return "";
  if (typeof definition === "string") return `s:${definition}`;
  try {
    return `o:${JSON.stringify(definition)}`;
  } catch {
    return `r:${Math.random()}`;
  }
}

function countStates(definition: ASLDefinition | undefined): number {
  if (!definition?.States || typeof definition.States !== "object") return 0;
  let total = 0;
  for (const state of Object.values(definition.States)) {
    if (!state || typeof state !== "object") continue;
    total += 1;
    if (Array.isArray(state.Branches)) {
      for (const branch of state.Branches) total += countStates(branch);
    }
    total += countStates(getItemProcessor(state));
  }
  return total;
}

/**
 * Finds the node a transition from `from` to `stateName` points to: a
 * sibling inside the same branch for nested states, a top-level state
 * otherwise.
 */
function resolveTransition(
  nodes: StateNode[],
  from: StateNode | null,
  stateName: string,
): StateNode | null {
  if (from?.parentId) {
    const parent = nodes.find((node) => node.id === from.parentId);
    return (
      parent?.children?.find(
        (child) =>
          child.name === stateName && child.branchIndex === from.branchIndex,
      ) ?? null
    );
  }
  return nodes.find((node) => !node.parentId && node.id === stateName) ?? null;
}

/**
 * A React component for visualizing AWS Step Functions workflows.
 *
 * This component parses and validates an ASL (Amazon States Language) definition,
 * generates a graphical layout, and renders the workflow using a graph visualization library.
 * It also provides interactivity for viewing state details and handling state click events.
 *
 * @component
 * @param {WorkflowViewerProps} props - The props for the WorkflowViewer component.
 * @param {ASLDefinition | string} [props.definition] - The ASL definition (object, JSON or YAML string).
 * @param {string} [props.url] - URL to load the ASL definition from.
 * @param {File} [props.file] - File object containing the ASL definition.
 * @param {number | string} [props.width=800] - Width in pixels or any CSS length (e.g. "100%").
 * @param {number | string} [props.height=600] - Height in pixels or any CSS length (e.g. "100%").
 * @param {string | ViewerTheme} [props.theme='light'] - Theme name or a custom theme object.
 * @param {boolean} [props.readonly=true] - Whether the viewer is in read-only mode.
 * @param {boolean} [props.isConnectable=true] - Whether nodes can be connected (ignored when readonly).
 * @param {boolean} [props.isDraggable=false] - Whether nodes can be dragged around.
 * @param {boolean} [props.isSelectable=true] - Whether nodes can be selected.
 * @param {boolean} [props.isMultiSelect=false] - Whether multiple nodes can be selected at once.
 * @param {boolean} [props.useMiniMap=false] - Whether to show a minimap for navigation.
 * @param {boolean} [props.useControls=true] - Whether to show zoom and pan controls.
 * @param {boolean} [props.useZoom=true] - Whether zooming and panning are enabled.
 * @param {boolean} [props.useFitView=true] - Whether to automatically fit the view to show all nodes.
 * @param {string} [props.layoutDirection='TB'] - 'TB' (top-bottom) or 'LR' (left-right).
 * @param {boolean} [props.showToolbar=false] - Whether to show the toolbar.
 * @param {boolean} [props.showDetailPanel=true] - Whether to open the details panel on click.
 * @param {boolean} [props.hideComment=false] - Whether to hide the workflow header.
 * @param {(state: StateNode) => void} [props.onStateClick] - Callback invoked when a state is clicked.
 * @param {(error: ValidationError) => void} [props.onValidationError] - Callback invoked for each validation issue.
 * @param {() => void} [props.onLoadStart] - Callback invoked when loading starts.
 * @param {() => void} [props.onLoadEnd] - Callback invoked when loading ends.
 * @param {(error: Error) => void} [props.onLoadError] - Callback invoked when loading fails.
 * @param {string} [props.className] - Additional CSS class names for the root container.
 * @param {React.CSSProperties} [props.style] - Inline styles for the root container.
 *
 * @example
 * ```tsx
 * <WorkflowViewer
 *   definition={aslDefinition}
 *   width="100%"
 *   height={640}
 *   theme="dark"
 *   showToolbar
 *   onStateClick={(state) => console.log("State clicked:", state)}
 * />
 * ```
 */
export const WorkflowViewer: React.FC<WorkflowViewerProps> = ({
  definition,
  url,
  file,
  width = 800,
  height = 600,
  theme = "light",
  hideComment = false,
  readonly = true,
  isConnectable = true,
  isDraggable = false,
  isSelectable = true,
  isMultiSelect = false,
  useMiniMap = false,
  useControls = true,
  useZoom = true,
  useFitView = true,
  layoutDirection: initialLayoutDirection = "TB",
  showToolbar = false,
  showDetailPanel = true,
  onStateClick,
  onValidationError,
  onLoadStart,
  onLoadEnd,
  onLoadError,
  className,
  style,
}) => {
  const callbacks = useLatest({
    onStateClick,
    onValidationError,
    onLoadStart,
    onLoadEnd,
    onLoadError,
  });
  const rendererRef = useRef<ReactFlowRendererHandle>(null);

  const [loadedDefinition, setLoadedDefinition] =
    useState<ASLDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Toolbar state
  const themeKey = typeof theme === "string" ? theme : JSON.stringify(theme);
  const [currentThemeName, setCurrentThemeName] = useState<ThemeName | null>(
    typeof theme === "string" ? theme : null,
  );
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">(
    initialLayoutDirection,
  );
  const [showMiniMapState, setShowMiniMapState] = useState(useMiniMap);
  const [showControlsState, setShowControlsState] = useState(useControls);
  const [showBackgroundState, setShowBackgroundState] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [selectedNode, setSelectedNode] = useState<StateNode | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);

  // Update state when props change
  useEffect(() => {
    setCurrentThemeName(typeof theme === "string" ? theme : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey]);

  useEffect(
    () => setLayoutDirection(initialLayoutDirection),
    [initialLayoutDirection],
  );

  useEffect(() => setShowMiniMapState(useMiniMap), [useMiniMap]);

  useEffect(() => setShowControlsState(useControls), [useControls]);

  // Load definition from URL or file. Stale responses are ignored and
  // in-flight requests are aborted when the source changes.
  useEffect(() => {
    if (!url && !file) {
      setLoadedDefinition(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    setIsLoading(true);
    setLoadError(null);
    callbacks.current.onLoadStart?.();

    const request = url
      ? loadFromURL(url, controller ? { signal: controller.signal } : undefined)
      : loadFromFile(file as File);

    request.then(
      (loaded) => {
        if (cancelled) return;
        setLoadedDefinition(loaded);
        setIsLoading(false);
        callbacks.current.onLoadEnd?.();
      },
      (error: unknown) => {
        if (cancelled) return;
        const loadErr =
          error instanceof Error ? error : new Error("Unknown loading error");
        setLoadedDefinition(null);
        setLoadError(loadErr);
        setIsLoading(false);
        callbacks.current.onLoadError?.(loadErr);
      },
    );

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [url, file, callbacks]);

  const currentDefinition = definition ?? loadedDefinition;
  const sourceKey = definitionKey(currentDefinition ?? null);

  const { parsedDefinition, errors } = useMemo(() => {
    if (!currentDefinition) {
      return { parsedDefinition: null, errors: [] as ValidationError[] };
    }

    try {
      const parsed =
        typeof currentDefinition === "string"
          ? parseDefinitionString(currentDefinition)
          : currentDefinition;
      return {
        parsedDefinition: parsed,
        errors: validateASLDefinition(parsed),
      };
    } catch (error) {
      const parseError: ValidationError = {
        message:
          error instanceof Error ? error.message : "Failed to parse definition",
        path: "root",
        severity: "error",
      };
      return { parsedDefinition: null, errors: [parseError] };
    }
    // Keyed by content: equal definitions do not trigger a new layout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  // Report validation issues outside of render
  useEffect(() => {
    const report = callbacks.current.onValidationError;
    if (report) errors.forEach((error) => report(error));
  }, [errors, callbacks]);

  const hasBlockingErrors =
    errors.some((error) => error.severity === "error") || !!loadError;

  const layout = useMemo(() => {
    if (!parsedDefinition || hasBlockingErrors) return null;
    try {
      return createGraphLayout(parsedDefinition, layoutDirection);
    } catch (error) {
      console.warn("asl-viewer: layout failed, using simple layout:", error);
      return createSimpleLayout(parsedDefinition);
    }
  }, [parsedDefinition, hasBlockingErrors, layoutDirection]);

  // A new workflow resets the interaction state
  useEffect(() => {
    setSelectedNode(null);
    setExpandedGroups(new Set());
    setSearchMatchIndex(0);
  }, [parsedDefinition]);

  const viewerTheme = useMemo(() => {
    if (currentThemeName) return getTheme(currentThemeName);
    if (typeof theme === "string") return getTheme(theme);
    return theme;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey, currentThemeName]);

  const themeStyle = useMemo(() => themeToCssVars(viewerTheme), [viewerTheme]);

  const groupIds = useMemo(
    () =>
      (layout?.nodes ?? [])
        .filter((node) => node.isGroup && !node.parentId)
        .map((node) => node.id),
    [layout],
  );
  const allGroupsExpanded =
    groupIds.length > 0 && groupIds.every((id) => expandedGroups.has(id));

  const handleToggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleToggleAllGroups = useCallback(() => {
    setExpandedGroups(allGroupsExpanded ? new Set() : new Set(groupIds));
  }, [allGroupsExpanded, groupIds]);

  // Search
  const matchCount = useMemo(
    () => findSearchMatches(layout?.nodes ?? [], searchTerm).length,
    [layout, searchTerm],
  );

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setSearchMatchIndex(0);
  }, []);

  const handleSearchNext = useCallback(() => {
    if (matchCount > 0) setSearchMatchIndex((i) => (i + 1) % matchCount);
  }, [matchCount]);

  const handleSearchPrevious = useCallback(() => {
    if (matchCount > 0)
      setSearchMatchIndex((i) => (i - 1 + matchCount) % matchCount);
  }, [matchCount]);

  // Selection
  const handleStateClick = useCallback(
    (state: StateNode) => {
      setSelectedNode(state);
      callbacks.current.onStateClick?.(state);
    },
    [callbacks],
  );

  const handleCloseDetail = useCallback(() => setSelectedNode(null), []);

  const handleNavigate = useCallback(
    (stateName: string) => {
      const target = resolveTransition(
        layout?.nodes ?? [],
        selectedNode,
        stateName,
      );
      if (!target) return;
      setSelectedNode(target);
      if (target.parentId && !expandedGroups.has(target.parentId)) {
        setExpandedGroups((previous) =>
          new Set(previous).add(target.parentId as string),
        );
      }
      setPendingFocus(target.id);
    },
    [layout, selectedNode, expandedGroups],
  );

  // Focus after the layout reflects any expansion triggered by navigation
  useEffect(() => {
    if (!pendingFocus) return;
    rendererRef.current?.focusState(pendingFocus);
    setPendingFocus(null);
  }, [pendingFocus, expandedGroups]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape") return;
      if (selectedNode) {
        setSelectedNode(null);
        event.stopPropagation();
      } else if (searchTerm) {
        handleSearchChange("");
        event.stopPropagation();
      }
    },
    [selectedNode, searchTerm, handleSearchChange],
  );

  const handleFitView = useCallback(() => rendererRef.current?.fitView(), []);

  const stateCount = useMemo(
    () => countStates(parsedDefinition ?? undefined),
    [parsedDefinition],
  );
  const warnings = useMemo(
    () => errors.filter((error) => error.severity === "warning"),
    [errors],
  );

  const isPanelOpen = showDetailPanel && !!selectedNode;
  const fitViewInset = useMemo(
    () => ({
      top: showToolbar ? TOOLBAR_INSET : 0,
      right: isPanelOpen ? PANEL_INSET : 0,
    }),
    [showToolbar, isPanelOpen],
  );

  const rootStyle: React.CSSProperties = {
    ...themeStyle,
    width,
    height,
    ...style,
  };

  // Show loading state
  if (isLoading && !definition) {
    return (
      <div
        className={classNames("asl-root", "asl-loading", className)}
        style={rootStyle}
        role="status"
        aria-live="polite"
      >
        <div className="asl-spinner" aria-hidden />
        <div className="asl-loading__title">Loading workflow…</div>
        <div className="asl-loading__detail">
          {url ? url : (file?.name ?? "Reading file")}
        </div>
      </div>
    );
  }

  // Nothing to show yet: neutral empty state
  if (!currentDefinition && !loadError) {
    return (
      <div
        className={classNames(
          "asl-root",
          "asl-loading",
          "asl-empty",
          className,
        )}
        style={rootStyle}
        role="status"
      >
        <span className="asl-empty__icon" aria-hidden>
          <IconJumpRope size={22} />
        </span>
        <div className="asl-loading__title">No workflow to display</div>
        <div className="asl-loading__detail">
          Provide a definition, URL or file to visualize a state machine.
        </div>
      </div>
    );
  }

  // Show error state
  if (hasBlockingErrors || !parsedDefinition || !layout) {
    const allErrors = [...errors];
    if (loadError) {
      allErrors.push({
        message: loadError.message,
        path: "loader",
        severity: "error",
      });
    }

    return (
      <ErrorDisplay
        errors={allErrors}
        theme={viewerTheme}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  const displayedThemeName: ThemeName =
    currentThemeName ??
    (isDarkColor(viewerTheme.background) ? "dark" : "light");

  return (
    <div
      className={classNames("asl-root", "asl-viewer", className)}
      style={rootStyle}
      onKeyDown={handleKeyDown}
    >
      {!hideComment && (
        <div className="asl-header">
          <span className="asl-header__icon" aria-hidden>
            <IconJumpRope size={16} />
          </span>
          <div className="asl-header__title">
            <span className="asl-header__name">Step Functions Workflow</span>
            {parsedDefinition.Comment && (
              <span
                className="asl-header__comment"
                title={parsedDefinition.Comment}
              >
                {parsedDefinition.Comment}
              </span>
            )}
          </div>
          <div className="asl-header__stats">
            {warnings.length > 0 && (
              <span
                className="asl-pill asl-pill--warning"
                title={warnings
                  .map((w) => `${w.path}: ${w.message}`)
                  .join("\n")}
              >
                <IconAlertTriangle size={12} aria-hidden />
                {warnings.length} warning{warnings.length === 1 ? "" : "s"}
              </span>
            )}
            <span className="asl-pill">
              {stateCount} state{stateCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}

      <div className={classNames("asl-stage", isPanelOpen && "has-panel")}>
        {showToolbar && (
          <ViewerToolbar
            theme={viewerTheme}
            currentThemeName={displayedThemeName}
            onThemeChange={setCurrentThemeName}
            layoutDirection={layoutDirection}
            onLayoutDirectionChange={setLayoutDirection}
            showMiniMap={showMiniMapState}
            onToggleMiniMap={() => setShowMiniMapState((value) => !value)}
            showControls={showControlsState}
            onToggleControls={() => setShowControlsState((value) => !value)}
            showBackground={showBackgroundState}
            onToggleBackground={() => setShowBackgroundState((value) => !value)}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onSearchNext={handleSearchNext}
            onSearchPrevious={handleSearchPrevious}
            searchMatchCount={matchCount}
            searchMatchIndex={searchMatchIndex}
            onFitView={handleFitView}
            hasGroups={groupIds.length > 0}
            allGroupsExpanded={allGroupsExpanded}
            onToggleAllGroups={handleToggleAllGroups}
          />
        )}

        <ReactFlowRenderer
          ref={rendererRef}
          nodes={layout.nodes}
          edges={layout.edges}
          theme={viewerTheme}
          onStateClick={handleStateClick}
          isConnectable={isConnectable && !readonly}
          isDraggable={isDraggable}
          isSelectable={isSelectable}
          isMultiSelect={isMultiSelect}
          useMiniMap={showMiniMapState}
          useControls={showControlsState}
          useBackground={showBackgroundState}
          useZoom={useZoom}
          useFitView={useFitView}
          layoutDirection={layoutDirection}
          searchTerm={searchTerm}
          searchMatchIndex={searchMatchIndex}
          selectedStateId={selectedNode?.id ?? null}
          expandedGroups={expandedGroups}
          onToggleGroup={handleToggleGroup}
          onPaneClick={handleCloseDetail}
          fitViewInset={fitViewInset}
        />

        {showDetailPanel && selectedNode && (
          <DetailPanel
            node={selectedNode}
            theme={viewerTheme}
            onClose={handleCloseDetail}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </div>
  );
};
