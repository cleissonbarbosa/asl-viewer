import React, { useMemo, useCallback, useState, useEffect } from "react";
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
import {
  loadFromURL,
  loadFromFile,
  parseDefinitionString,
} from "../core/loader";
import { ReactFlowRenderer } from "./ReactFlowRenderer";
import { ErrorDisplay } from "./ErrorDisplay";
import { ViewerToolbar } from "./ViewerToolbar";
import { IconLoader } from "@tabler/icons-react";

/**
 * A React component for visualizing AWS Step Functions workflows.
 *
 * This component parses and validates an ASL (Amazon States Language) definition,
 * generates a graphical layout, and renders the workflow using a graph visualization library.
 * It also provides interactivity for viewing state details and handling state click events.
 *
 * @component
 * @param {WorkflowViewerProps} props - The props for the WorkflowViewer component.
 * @param {ASLDefinition | string} [props.definition] - The ASL definition of the workflow to be visualized.
 * @param {string} [props.url] - URL to load the ASL definition from.
 * @param {File} [props.file] - File object containing the ASL definition.
 * @param {number} [props.width=800] - The width of the viewer in pixels.
 * @param {number} [props.height=600] - The height of the viewer in pixels.
 * @param {string} [props.theme='light'] - The theme of the viewer, either 'light' or 'dark'.
 * @param {boolean} [props.readonly=true] - Whether the viewer is in read-only mode.
 * @param {boolean} [props.isConnectable=true] - Whether nodes can be connected to each other.
 * @param {boolean} [props.isDraggable=false] - Whether nodes can be dragged around.
 * @param {boolean} [props.isSelectable=true] - Whether nodes can be selected.
 * @param {boolean} [props.isMultiSelect=false] - Whether multiple nodes can be selected at once.
 * @param {boolean} [props.useMiniMap=false] - Whether to show a minimap for navigation.
 * @param {boolean} [props.useControls=true] - Whether to show zoom and pan controls.
 * @param {boolean} [props.useZoom=true] - Whether zooming is enabled.
 * @param {boolean} [props.useFitView=true] - Whether to automatically fit the view to show all nodes.
 * @param {string} [props.layoutDirection='TB'] - The layout direction of the graph, either 'TB' (top-bottom) or 'LR' (left-right).
 * @param {boolean} [props.showToolbar=false] - Whether to show the toolbar for additional controls.
 * @param {boolean} [props.hideComment=false] - Whether to hide the workflow comment/header.
 * @param {(state: StateNode) => void} [props.onStateClick] - Callback invoked when a state is clicked.
 * @param {(error: ValidationError) => void} [props.onValidationError] - Callback invoked when validation errors occur.
 * @param {() => void} [props.onLoadStart] - Callback invoked when loading starts.
 * @param {() => void} [props.onLoadEnd] - Callback invoked when loading ends.
 * @param {(error: Error) => void} [props.onLoadError] - Callback invoked when loading fails.
 * @param {string} [props.className] - Additional CSS class names for the root container.
 * @param {React.CSSProperties} [props.style] - Inline styles for the root container.
 *
 * @returns {JSX.Element} The rendered WorkflowViewer component.
 *
 * @example
 * ```tsx
 * // Basic usage with definition object
 * <WorkflowViewer
 *   definition={aslDefinition}
 *   width={1000}
 *   height={800}
 *   theme="dark"
 *   onStateClick={(state) => console.log('State clicked:', state)}
 * />
 *
 * // Interactive mode with minimap and controls
 * <WorkflowViewer
 *   definition={workflow}
 *   useMiniMap={true}
 *   useControls={true}
 *   isDraggable={true}
 *   isMultiSelect={true}
 *   readonly={false}
 * />
 *
 * // Minimal view without controls
 * <WorkflowViewer
 *   definition={workflow}
 *   useControls={false}
 *   useFitView={false}
 *   useZoom={false}
 *   isSelectable={false}
 * />
 *
 * // Load from URL
 * <WorkflowViewer
 *   url="https://example.com/workflow.json"
 *   onLoadStart={() => console.log('Loading...')}
 *   onLoadEnd={() => console.log('Loaded!')}
 * />
 *
 * // Load from file upload
 * <WorkflowViewer
 *   file={selectedFile}
 *   onLoadError={(error) => console.error('Load error:', error)}
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
  onStateClick,
  onValidationError,
  onLoadStart,
  onLoadEnd,
  onLoadError,
  className,
  style,
}) => {
  const [selectedState, setSelectedState] = useState<StateNode | null>(null);
  const [loadedDefinition, setLoadedDefinition] =
    useState<ASLDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Toolbar state
  const [currentThemeName, setCurrentThemeName] = useState<ThemeName>(
    typeof theme === "string" ? (theme as ThemeName) : "light",
  );
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">(
    initialLayoutDirection,
  );
  const [showMiniMapState, setShowMiniMapState] = useState(useMiniMap);
  const [showControlsState, setShowControlsState] = useState(useControls);
  const [showBackgroundState, setShowBackgroundState] = useState(true);

  // Update state when props change
  useEffect(() => {
    if (typeof theme === "string") {
      setCurrentThemeName(theme as ThemeName);
    }
  }, [theme]);

  useEffect(() => {
    setShowMiniMapState(useMiniMap);
  }, [useMiniMap]);

  useEffect(() => {
    setShowControlsState(useControls);
  }, [useControls]);

  // Load definition from URL or file
  useEffect(() => {
    async function loadDefinition() {
      if (!url && !file) return;

      setIsLoading(true);
      setLoadError(null);
      onLoadStart?.();

      try {
        let loaded: ASLDefinition;

        if (url) {
          loaded = await loadFromURL(url);
        } else if (file) {
          loaded = await loadFromFile(file);
        } else {
          return;
        }

        setLoadedDefinition(loaded);
        onLoadEnd?.();
      } catch (error) {
        const loadErr =
          error instanceof Error ? error : new Error("Unknown loading error");
        setLoadError(loadErr);
        onLoadError?.(loadErr);
      } finally {
        setIsLoading(false);
      }
    }

    loadDefinition();
  }, [url, file, onLoadStart, onLoadEnd, onLoadError]);

  const currentDefinition = useMemo(() => {
    if (definition) {
      return definition;
    }
    return loadedDefinition;
  }, [definition, loadedDefinition]);

  const { parsedDefinition, errors } = useMemo(() => {
    if (!currentDefinition) {
      return { parsedDefinition: null, errors: [] };
    }

    try {
      let parsed: ASLDefinition;

      if (typeof currentDefinition === "string") {
        parsed = parseDefinitionString(currentDefinition);
      } else {
        parsed = currentDefinition;
      }

      const validationErrors = validateASLDefinition(parsed);

      if (onValidationError && validationErrors.length > 0) {
        validationErrors.forEach((error) => onValidationError(error));
      }

      return {
        parsedDefinition: parsed,
        errors: validationErrors,
      };
    } catch (error) {
      const parseError: ValidationError = {
        message:
          error instanceof Error ? error.message : "Failed to parse definition",
        path: "root",
        severity: "error",
      };

      if (onValidationError) {
        onValidationError(parseError);
      }

      return {
        parsedDefinition: null,
        errors: [parseError],
      };
    }
  }, [currentDefinition, onValidationError]);

  const layout = useMemo(() => {
    if (!parsedDefinition) return null;

    try {
      // Try to use Dagre layout, fall back to simple layout if Dagre fails
      return createGraphLayout(parsedDefinition, layoutDirection);
    } catch (error) {
      console.warn("Dagre layout failed, using simple layout:", error);
      return createSimpleLayout(parsedDefinition);
    }
  }, [parsedDefinition, layoutDirection]);

  const viewerTheme = useMemo(() => {
    // If user is using toolbar to switch themes, use that
    if (currentThemeName) {
      return getTheme(currentThemeName);
    }
    // Fallback to prop
    if (typeof theme === "string") {
      return getTheme(theme as ThemeName);
    }
    return theme;
  }, [theme, currentThemeName]);

  const handleStateClick = useCallback(
    (state: StateNode) => {
      setSelectedState(state);
      onStateClick?.(state);
    },
    [onStateClick],
  );

  const hasErrors =
    errors.some((error) => error.severity === "error") || loadError;

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: viewerTheme.background,
          color: viewerTheme.textColor,
          ...style,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              marginBottom: "8px",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconLoader />
            Loading...
          </div>
          <div style={{ fontSize: "12px", opacity: 0.7 }}>
            {url ? `Loading from URL: ${url}` : "Loading from file..."}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasErrors || !currentDefinition || !parsedDefinition || !layout) {
    const allErrors = [...errors];
    if (loadError) {
      allErrors.push({
        message: loadError.message,
        path: "loader",
        severity: "error",
      });
    }
    if (!currentDefinition && !loadError) {
      allErrors.push({
        message:
          "No definition provided. Please provide a definition, URL, or file.",
        path: "input",
        severity: "error",
      });
    }

    return (
      <div
        className={className}
        style={{
          width,
          height,
          ...style,
        }}
      >
        <ErrorDisplay
          errors={allErrors}
          theme={viewerTheme}
          width={width}
          height={height}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        ...style,
      }}
    >
      {/* Header with workflow info */}
      {!hideComment && (
        <div
          style={{
            padding: "8px 12px",
            background: viewerTheme.background,
            borderBottom: `1px solid ${viewerTheme.borderColor}`,
            fontSize: "14px",
            fontWeight: "bold",
            color: viewerTheme.textColor,
          }}
        >
          Step Functions Workflow
          {parsedDefinition.Comment && (
            <span
              style={{ fontWeight: "normal", marginLeft: "8px", opacity: 0.7 }}
            >
              - {parsedDefinition.Comment}
            </span>
          )}
        </div>
      )}

      {/* Main graph area */}
      <div style={{ flex: 1, position: "relative" }}>
        {showToolbar && (
          <ViewerToolbar
            theme={viewerTheme}
            currentThemeName={currentThemeName}
            onThemeChange={setCurrentThemeName}
            layoutDirection={layoutDirection}
            onLayoutDirectionChange={setLayoutDirection}
            showMiniMap={showMiniMapState}
            onToggleMiniMap={() => setShowMiniMapState(!showMiniMapState)}
            showControls={showControlsState}
            onToggleControls={() => setShowControlsState(!showControlsState)}
            showBackground={showBackgroundState}
            onToggleBackground={() =>
              setShowBackgroundState(!showBackgroundState)
            }
          />
        )}
        <ReactFlowRenderer
          nodes={layout.nodes}
          edges={layout.edges}
          width={width}
          height={height - 40} // Account for header
          theme={viewerTheme}
          onStateClick={handleStateClick}
          isConnectable={isConnectable || readonly}
          isDraggable={isDraggable}
          isSelectable={isSelectable}
          isMultiSelect={isMultiSelect}
          useMiniMap={showMiniMapState}
          useControls={showControlsState}
          useBackground={showBackgroundState}
          useZoom={useZoom}
          useFitView={useFitView}
          layoutDirection={layoutDirection}
        />
      </div>

      {/* State details panel */}
      {selectedState && (
        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "50px",
            width: "250px",
            maxHeight: height - 60,
            background: viewerTheme.background,
            border: `1px solid ${viewerTheme.borderColor}`,
            borderRadius: "4px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            overflow: "auto",
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: `1px solid ${viewerTheme.borderColor}`,
              fontSize: "14px",
              fontWeight: "bold",
              color: viewerTheme.textColor,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            State Details
            <button
              onClick={() => setSelectedState(null)}
              style={{
                background: "none",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                color: viewerTheme.textColor,
                padding: "0 4px",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: "12px" }}>
            <StateDetails state={selectedState} theme={viewerTheme} />
          </div>
        </div>
      )}
    </div>
  );
};

const DetailSection: React.FC<{
  title: string;
  children: React.ReactNode;
  theme: any;
}> = ({ title, children, theme }) => (
  <div style={{ marginBottom: "16px" }}>
    <div
      style={{
        fontSize: "11px",
        fontWeight: "bold",
        textTransform: "uppercase",
        color: theme.textColorSecondary,
        marginBottom: "8px",
        borderBottom: `1px solid ${theme.borderColor}`,
        paddingBottom: "4px",
        letterSpacing: "0.5px",
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: "12px" }}>{children}</div>
  </div>
);

const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  theme: any;
}> = ({ label, value, theme }) => (
  <div
    style={{ marginBottom: "6px", display: "flex", flexDirection: "column" }}
  >
    <span
      style={{
        fontWeight: 600,
        color: theme.textColorSecondary,
        fontSize: "11px",
        marginBottom: "2px",
      }}
    >
      {label}:
    </span>
    <span
      style={{
        color: theme.textColor,
        wordBreak: "break-word",
        lineHeight: "1.4",
      }}
    >
      {value}
    </span>
  </div>
);

const JsonView: React.FC<{ data: any; theme: any }> = ({ data, theme }) => (
  <pre
    style={{
      background: theme.background === "#ffffff" ? "#f8f9fa" : "#1e1e1e",
      padding: "8px",
      borderRadius: "4px",
      fontSize: "10px",
      overflowX: "auto",
      border: `1px solid ${theme.borderColor}`,
      margin: "4px 0 0 0",
      fontFamily: "monospace",
    }}
  >
    {JSON.stringify(data, null, 2)}
  </pre>
);

const StateDetails: React.FC<{ state: StateNode; theme: any }> = ({
  state,
  theme,
}) => {
  const def = state.definition;

  return (
    <div style={{ color: theme.textColor, fontSize: "12px" }}>
      {/* Header Info */}
      <div
        style={{
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: `1px solid ${theme.borderColor}`,
        }}
      >
        <div
          style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}
        >
          {state.name}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "bold",
              backgroundColor:
                theme.nodeBorderColors[state.type.toLowerCase()] ||
                theme.borderColor,
              color: "#fff",
            }}
          >
            {state.type.toUpperCase()}
          </div>
          {state.isStartState && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "bold",
                backgroundColor: theme.successColor,
                color: "#fff",
              }}
            >
              START
            </span>
          )}
          {state.isEndState && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "bold",
                backgroundColor:
                  state.type === "Succeed"
                    ? theme.successColor
                    : theme.errorColor,
                color: "#fff",
              }}
            >
              END
            </span>
          )}
        </div>
      </div>

      {/* General */}
      {def.Comment && (
        <DetailSection title="Description" theme={theme}>
          <div style={{ fontStyle: "italic", lineHeight: "1.4" }}>
            {def.Comment}
          </div>
        </DetailSection>
      )}

      {/* Configuration */}
      {(def.Resource ||
        def.TimeoutSeconds !== undefined ||
        def.HeartbeatSeconds !== undefined) && (
        <DetailSection title="Configuration" theme={theme}>
          {def.Resource && (
            <DetailRow label="Resource" value={def.Resource} theme={theme} />
          )}
          {def.TimeoutSeconds !== undefined && (
            <DetailRow
              label="Timeout"
              value={`${def.TimeoutSeconds}s`}
              theme={theme}
            />
          )}
          {def.HeartbeatSeconds !== undefined && (
            <DetailRow
              label="Heartbeat"
              value={`${def.HeartbeatSeconds}s`}
              theme={theme}
            />
          )}
        </DetailSection>
      )}

      {/* Type Specific */}
      {(state.type === "Wait" ||
        state.type === "Map" ||
        state.type === "Fail") && (
        <DetailSection title={`${state.type} Details`} theme={theme}>
          {/* Wait */}
          {def.Seconds !== undefined && (
            <DetailRow label="Seconds" value={def.Seconds} theme={theme} />
          )}
          {def.Timestamp && (
            <DetailRow label="Timestamp" value={def.Timestamp} theme={theme} />
          )}
          {def.SecondsPath && (
            <DetailRow
              label="SecondsPath"
              value={def.SecondsPath}
              theme={theme}
            />
          )}
          {def.TimestampPath && (
            <DetailRow
              label="TimestampPath"
              value={def.TimestampPath}
              theme={theme}
            />
          )}

          {/* Map */}
          {def.ItemsPath && (
            <DetailRow label="ItemsPath" value={def.ItemsPath} theme={theme} />
          )}
          {def.MaxConcurrency !== undefined && (
            <DetailRow
              label="MaxConcurrency"
              value={def.MaxConcurrency}
              theme={theme}
            />
          )}

          {/* Fail */}
          {def.Error && (
            <DetailRow label="Error" value={def.Error} theme={theme} />
          )}
          {def.Cause && (
            <DetailRow label="Cause" value={def.Cause} theme={theme} />
          )}
        </DetailSection>
      )}

      {/* Data Flow */}
      {(def.InputPath ||
        def.OutputPath ||
        def.ResultPath ||
        def.Parameters ||
        def.ResultSelector ||
        def.Result) && (
        <DetailSection title="Data Flow" theme={theme}>
          {def.InputPath && (
            <DetailRow label="InputPath" value={def.InputPath} theme={theme} />
          )}
          {def.Parameters && (
            <div style={{ marginBottom: "8px" }}>
              <span
                style={{
                  fontWeight: 600,
                  color: theme.textColorSecondary,
                  fontSize: "11px",
                }}
              >
                Parameters:
              </span>
              <JsonView data={def.Parameters} theme={theme} />
            </div>
          )}
          {def.ResultSelector && (
            <div style={{ marginBottom: "8px" }}>
              <span
                style={{
                  fontWeight: 600,
                  color: theme.textColorSecondary,
                  fontSize: "11px",
                }}
              >
                ResultSelector:
              </span>
              <JsonView data={def.ResultSelector} theme={theme} />
            </div>
          )}
          {def.Result && (
            <div style={{ marginBottom: "8px" }}>
              <span
                style={{
                  fontWeight: 600,
                  color: theme.textColorSecondary,
                  fontSize: "11px",
                }}
              >
                Result:
              </span>
              <JsonView data={def.Result} theme={theme} />
            </div>
          )}
          {def.ResultPath && (
            <DetailRow
              label="ResultPath"
              value={def.ResultPath}
              theme={theme}
            />
          )}
          {def.OutputPath && (
            <DetailRow
              label="OutputPath"
              value={def.OutputPath}
              theme={theme}
            />
          )}
        </DetailSection>
      )}

      {/* Error Handling */}
      {(def.Retry || def.Catch) && (
        <DetailSection title="Error Handling" theme={theme}>
          {def.Retry && (
            <div style={{ marginBottom: "4px" }}>
              <span
                style={{ fontWeight: 600, color: theme.textColorSecondary }}
              >
                Retries:
              </span>{" "}
              {def.Retry.length} defined
            </div>
          )}
          {def.Catch && (
            <div>
              <span
                style={{ fontWeight: 600, color: theme.textColorSecondary }}
              >
                Catchers:
              </span>{" "}
              {def.Catch.length} defined
            </div>
          )}
        </DetailSection>
      )}

      {/* Flow */}
      <DetailSection title="Flow Control" theme={theme}>
        {def.Next && <DetailRow label="Next" value={def.Next} theme={theme} />}
        {def.Default && (
          <DetailRow label="Default" value={def.Default} theme={theme} />
        )}
        {def.End && <DetailRow label="End" value="True" theme={theme} />}
      </DetailSection>
    </div>
  );
};
