import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  WorkflowViewerProps,
  StateNode,
  ValidationError,
  ASLDefinition,
} from "../types";
import { parseASLDefinition, validateASLDefinition } from "../utils/validation";
import { createGraphLayout, createSimpleLayout } from "../utils/layout";
import { getTheme } from "../utils/theme";
import {
  loadFromURL,
  loadFromFile,
  parseDefinitionString,
} from "../utils/loader";
import { ReactFlowRenderer } from "./ReactFlowRenderer";
import { ErrorDisplay } from "./ErrorDisplay";
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
      return createGraphLayout(parsedDefinition);
    } catch (error) {
      console.warn("Dagre layout failed, using simple layout:", error);
      return createSimpleLayout(parsedDefinition);
    }
  }, [parsedDefinition]);

  const viewerTheme = useMemo(() => getTheme(theme), [theme]);

  const handleStateClick = useCallback(
    (state: StateNode) => {
      setSelectedState(state);
      onStateClick?.(state);
    },
    [onStateClick]
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
          useMiniMap={useMiniMap}
          useControls={useControls}
          useZoom={useZoom}
          useFitView={useFitView}
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

const StateDetails: React.FC<{ state: StateNode; theme: any }> = ({
  state,
  theme,
}) => {
  console.log("State Details:", state);
  return (
    <div style={{ color: theme.textColor, fontSize: "12px" }}>
      <div style={{ marginBottom: "8px" }}>
        <strong>Name:</strong> {state.name}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <strong>Type:</strong> {state.type}
      </div>
      {state.definition.Comment && (
        <div style={{ marginBottom: "8px" }}>
          <strong>Comment:</strong> {state.definition.Comment}
        </div>
      )}
      {state.definition.Resource && (
        <div style={{ marginBottom: "8px" }}>
          <strong>Resource:</strong>
          <div
            style={{
              wordBreak: "break-all",
              fontSize: "10px",
              marginTop: "2px",
              padding: "4px",
              background: theme.nodeColors.task,
              borderRadius: "2px",
            }}
          >
            {state.definition.Resource}
          </div>
        </div>
      )}
      {state.definition.Next && (
        <div style={{ marginBottom: "8px" }}>
          <strong>Next State:</strong> {state.definition.Next}
        </div>
      )}
      {state.definition.End && (
        <div style={{ marginBottom: "8px" }}>
          <strong>End:</strong> {state.definition.End.toString()}
        </div>
      )}
      {state.isStartState && (
        <div
          style={{
            padding: "4px 8px",
            background: theme.successColor,
            color: "white",
            borderRadius: "2px",
            marginBottom: "4px",
            fontSize: "10px",
          }}
        >
          START STATE
        </div>
      )}
      {state.isEndState && (
        <div
          style={{
            padding: "4px 8px",
            background:
              state.type === "Succeed" ? theme.successColor : theme.errorColor,
            color: "white",
            borderRadius: "2px",
            fontSize: "10px",
          }}
        >
          END STATE
        </div>
      )}
    </div>
  );
};
