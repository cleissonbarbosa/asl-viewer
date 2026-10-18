import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Edge,
  EdgeProps,
  EdgeTypes,
  MiniMap,
  Node,
  NodeChange,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlowInstance,
  getViewportForBounds,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import "../styles.css";

import { Connection, StateNode, ViewerTheme } from "../types";
import {
  START_NODE_ID,
  getNodeKind,
  isArtificialNode,
  truncate,
} from "../core/asl-utils";
import {
  ANIMATION_DURATION,
  calculateHierarchicalLayout,
  easingFunctions,
  prefersReducedMotion,
} from "../core/layout";
import { ReactFlowStateNode } from "./ReactFlowStateNode";
import { ReactFlowGroupNode } from "./ReactFlowGroupNode";
import { AslEdge } from "./ReactFlowEdge";
import { findSearchMatches, locateState } from "./search";
import { themeToCssVars, withAlpha } from "./theme-vars";
import { AslEdgeData, Point, StateNodeData, classNames } from "./flow-types";

export interface ReactFlowRendererProps {
  nodes: StateNode[];
  edges: Connection[];
  /** Width in pixels or any CSS length. Defaults to `100%`. */
  width?: number | string;
  /** Height in pixels or any CSS length. Defaults to `100%`. */
  height?: number | string;
  theme: ViewerTheme;
  onStateClick?: (state: StateNode) => void;
  isConnectable?: boolean;
  isDraggable?: boolean;
  isSelectable?: boolean;
  isMultiSelect?: boolean;
  useMiniMap?: boolean;
  useControls?: boolean;
  useBackground?: boolean;
  useZoom?: boolean;
  useFitView?: boolean;
  layoutDirection?: "TB" | "LR";
  searchTerm?: string;
  searchMatchIndex?: number;
  onNodeClick?: (state: StateNode) => void;
  /** Id of the selected state; its node and edges are highlighted. */
  selectedStateId?: string | null;
  /** Controlled set of expanded Parallel / Map groups. */
  expandedGroups?: ReadonlySet<string>;
  /** Called when a group is toggled (required when `expandedGroups` is set). */
  onToggleGroup?: (groupId: string) => void;
  /** Called when the empty canvas is clicked. */
  onPaneClick?: () => void;
  /**
   * Space covered by overlays (toolbars, panels). Fitting and centering use
   * the remaining area so content is never hidden behind them.
   */
  fitViewInset?: ViewportInset;
  className?: string;
}

export interface ViewportInset {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/**
 * Imperative API exposed through `ref`.
 */
export interface ReactFlowRendererHandle {
  /** Fits the whole workflow in the viewport. */
  fitView: (options?: { duration?: number }) => void;
  /** Centers the viewport on a state (top-level or nested in a group). */
  focusState: (stateId: string, options?: { duration?: number }) => void;
}

const nodeTypes: NodeTypes = {
  stateNode: ReactFlowStateNode as React.ComponentType<NodeProps>,
  groupNode: ReactFlowGroupNode as React.ComponentType<NodeProps>,
};

const edgeTypes: EdgeTypes = {
  aslEdge: AslEdge as React.ComponentType<EdgeProps>,
};

const FIT_VIEW_OPTIONS = { padding: 0.2, minZoom: 0.1, maxZoom: 1.2 };
const LARGE_GRAPH_THRESHOLD = 150;
const LABEL_MAX_LENGTH = 28;

type Snapshot = {
  positions: Map<string, Point>;
  sizes: Map<string, string>;
  points: Map<string, Point[] | undefined>;
};

function shallowEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Returns a memoized value per key; the value is recreated only when its
 * dependencies change. Keeps node / edge `data` referentially stable so the
 * memoized components skip re-rendering.
 */
function useKeyedMemo<T>() {
  const cache = useRef(new Map<string, { deps: unknown[]; value: T }>());
  return useMemo(
    () => ({
      get(key: string, deps: unknown[], create: () => T): T {
        const cached = cache.current.get(key);
        if (cached && shallowEqual(cached.deps, deps)) return cached.value;
        const value = create();
        cache.current.set(key, { deps, value });
        return value;
      },
      /** Drops entries whose key is not in `keys`. */
      retain(keys: Set<string>) {
        cache.current.forEach((_, key) => {
          if (!keys.has(key)) cache.current.delete(key);
        });
      },
    }),
    [],
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function snapshotOf(nodes: Node[], edges: Edge<AslEdgeData>[]): Snapshot {
  return {
    positions: new Map(nodes.map((n) => [n.id, { ...n.position }])),
    sizes: new Map(
      nodes.map((n) => [n.id, `${n.style?.width}x${n.style?.height}`]),
    ),
    points: new Map(edges.map((e) => [e.id, e.data?.points])),
  };
}

function boundsOf(nodes: Node[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const width = Number(node.style?.width ?? 0);
    const height = Number(node.style?.height ?? 0);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function toggleInSet(set: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * Renders a laid-out workflow with React Flow.
 */
export const ReactFlowRenderer = forwardRef<
  ReactFlowRendererHandle,
  ReactFlowRendererProps
>(function ReactFlowRenderer(
  {
    nodes: stateNodes,
    edges: connections,
    width = "100%",
    height = "100%",
    theme,
    onStateClick,
    isConnectable = false,
    isDraggable = true,
    isSelectable = true,
    isMultiSelect = false,
    useMiniMap = false,
    useControls = true,
    useBackground = true,
    useZoom = true,
    useFitView = true,
    layoutDirection = "TB",
    searchTerm = "",
    searchMatchIndex = 0,
    onNodeClick,
    selectedStateId = null,
    expandedGroups,
    onToggleGroup,
    onPaneClick,
    fitViewInset,
    className,
  },
  ref,
) {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const insetRef = useRef(fitViewInset);
  insetRef.current = fitViewInset;
  const clickHandler = onNodeClick || onStateClick;

  // Expanded groups: controlled through props, or managed internally
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    () => new Set(),
  );
  const expanded = expandedGroups ?? internalExpanded;
  const structureKey = useMemo(
    () => stateNodes.map((node) => node.id).join("\u0000"),
    [stateNodes],
  );
  useEffect(() => setInternalExpanded(new Set()), [structureKey]);

  // Stable handler: node data does not change when the expansion does
  const toggleConfig = useRef({ onToggleGroup, controlled: !!expandedGroups });
  toggleConfig.current = { onToggleGroup, controlled: !!expandedGroups };
  const handleToggleGroup = useCallback((groupId: string) => {
    const { onToggleGroup: onToggle, controlled } = toggleConfig.current;
    onToggle?.(groupId);
    if (!controlled) {
      setInternalExpanded((previous) => toggleInSet(previous, groupId));
    }
  }, []);

  // Re-run the layout when the expansion state differs from the input
  const graph = useMemo(() => {
    const needsLayout = stateNodes.some(
      (node) => node.isGroup && expanded.has(node.id) !== !!node.isExpanded,
    );
    if (!needsLayout) return { nodes: stateNodes, edges: connections };
    const result = calculateHierarchicalLayout(
      stateNodes,
      connections,
      START_NODE_ID,
      layoutDirection,
      { expandedGroups: expanded },
    );
    return { nodes: result.nodes, edges: result.edges };
  }, [stateNodes, connections, expanded, layoutDirection]);

  const visibleNodes = useMemo(
    () => graph.nodes.filter((node) => !node.parentId),
    [graph.nodes],
  );

  // Search
  const matches = useMemo(
    () => findSearchMatches(visibleNodes, searchTerm),
    [visibleNodes, searchTerm],
  );
  const activeMatch =
    matches.length > 0
      ? matches[
          ((searchMatchIndex % matches.length) + matches.length) %
            matches.length
        ]
      : null;
  const highlightedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const match of matches) {
      ids.add(match.id);
      ids.add(match.nodeId);
    }
    return ids;
  }, [matches]);
  const isSearching = searchTerm.trim().length > 0 && matches.length > 0;

  // Selection: the top-level node that contains the selected state
  const selectedNodeId = useMemo(() => {
    if (!selectedStateId) return null;
    const direct = visibleNodes.find((node) => node.id === selectedStateId);
    if (direct) return direct.id;
    const parent = visibleNodes.find((node) =>
      node.children?.some((child) => child.id === selectedStateId),
    );
    return parent?.id ?? null;
  }, [visibleNodes, selectedStateId]);

  const isTB = layoutDirection === "TB";
  const sourcePosition = isTB ? Position.Bottom : Position.Right;
  const targetPosition = isTB ? Position.Top : Position.Left;

  const nodeData = useKeyedMemo<StateNodeData>();
  const edgeData = useKeyedMemo<AslEdgeData>();
  const dragOverrides = useRef(new Map<string, Point>());
  useEffect(() => {
    dragOverrides.current.clear();
  }, [graph]);

  const rfNodes: Node<StateNodeData>[] = useMemo(() => {
    nodeData.retain(new Set(visibleNodes.map((node) => node.id)));
    return visibleNodes.map((stateNode) => {
      const isHighlighted = highlightedIds.has(stateNode.id);
      const isActiveMatch = activeMatch?.nodeId === stateNode.id;
      const isSelected = selectedNodeId === stateNode.id;
      const isDimmed = isSearching && !isHighlighted;
      const groupHighlights = stateNode.isGroup ? highlightedIds : undefined;
      const groupSelection = stateNode.isGroup ? selectedStateId : undefined;
      const data = nodeData.get(
        stateNode.id,
        [
          stateNode,
          clickHandler,
          handleToggleGroup,
          isHighlighted,
          isActiveMatch,
          isSelected,
          isDimmed,
          groupHighlights,
          groupSelection,
        ],
        () => ({
          stateNode,
          onStateClick: clickHandler,
          onToggleExpand: handleToggleGroup,
          isHighlighted,
          isActiveMatch,
          isSelected,
          isDimmed,
          highlightedIds: groupHighlights,
          selectedId: groupSelection,
        }),
      );
      return {
        id: stateNode.id,
        type: stateNode.isGroup ? "groupNode" : "stateNode",
        position: dragOverrides.current.get(stateNode.id) ?? stateNode.position,
        data,
        style: { width: stateNode.size.width, height: stateNode.size.height },
        draggable: isDraggable && !isArtificialNode(stateNode.id),
        selectable: isSelectable,
        connectable: isConnectable,
        sourcePosition,
        targetPosition,
      };
    });
  }, [
    visibleNodes,
    highlightedIds,
    activeMatch,
    selectedNodeId,
    selectedStateId,
    isSearching,
    clickHandler,
    handleToggleGroup,
    isDraggable,
    isSelectable,
    isConnectable,
    sourcePosition,
    targetPosition,
    nodeData,
  ]);

  const rfEdges: Edge<AslEdgeData>[] = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const seen = new Map<string, number>();
    const result: Edge<AslEdgeData>[] = [];
    for (const connection of graph.edges) {
      if (!visibleIds.has(connection.from) || !visibleIds.has(connection.to)) {
        continue;
      }
      const pair = `${connection.from}->${connection.to}`;
      const duplicate = seen.get(pair) ?? 0;
      seen.set(pair, duplicate + 1);
      const id = `${pair}#${duplicate}`;

      const touchesSelection =
        !!selectedNodeId &&
        (connection.from === selectedNodeId ||
          connection.to === selectedNodeId);
      const isDimmed =
        (isSearching &&
          !(
            highlightedIds.has(connection.from) &&
            highlightedIds.has(connection.to)
          )) ||
        (!!selectedNodeId && !touchesSelection && !isSearching);
      const condition = connection.condition?.trim();
      const labelText =
        connection.type === "default"
          ? "Default"
          : condition && condition !== "condition"
            ? truncate(condition, LABEL_MAX_LENGTH)
            : connection.label;
      const labelTitle =
        connection.label && condition
          ? `${connection.label}: ${condition}`
          : connection.label || condition;

      const data = edgeData.get(
        id,
        [connection, touchesSelection, isDimmed, duplicate],
        () => ({
          connection,
          points: connection.points,
          labelText,
          labelTitle,
          labelOffset: duplicate,
          isActive: touchesSelection,
          isDimmed,
        }),
      );
      result.push({
        id,
        source: connection.from,
        target: connection.to,
        type: "aslEdge",
        data,
        focusable: false,
      });
    }
    edgeData.retain(new Set(result.map((edge) => edge.id)));
    return result;
  }, [
    graph.edges,
    visibleNodes,
    selectedNodeId,
    isSearching,
    highlightedIds,
    edgeData,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);
  const rfNodesRef = useRef(rfNodes);
  rfNodesRef.current = rfNodes;

  /** Visible area of the canvas once overlays are excluded. */
  const getViewArea = useCallback(() => {
    const element = wrapperRef.current;
    if (!element) return null;
    const { width, height } = element.getBoundingClientRect();
    const inset = insetRef.current ?? {};
    const top = inset.top ?? 0;
    const bottom = inset.bottom ?? 0;
    const left = inset.left ?? 0;
    // A side panel wider than half of the canvas is treated as an overlay
    const right =
      (inset.right ?? 0) * 1.8 < width - left ? (inset.right ?? 0) : 0;
    return {
      left,
      top,
      width: Math.max(120, width - left - right),
      height: Math.max(120, height - top - bottom),
    };
  }, []);

  const fitNodes = useCallback(
    (targetNodes: Node[], duration = 0) => {
      const area = getViewArea();
      if (!rfInstance || !area || targetNodes.length === 0) return;
      const viewport = getViewportForBounds(
        boundsOf(targetNodes),
        area.width,
        area.height,
        FIT_VIEW_OPTIONS.minZoom,
        FIT_VIEW_OPTIONS.maxZoom,
        FIT_VIEW_OPTIONS.padding,
      );
      rfInstance.setViewport(
        {
          x: viewport.x + area.left,
          y: viewport.y + area.top,
          zoom: viewport.zoom,
        },
        { duration },
      );
    },
    [rfInstance, getViewArea],
  );

  // Initial fit, once React Flow is ready
  useEffect(() => {
    if (rfInstance && useFitView) fitNodes(rfNodesRef.current, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfInstance]);

  // Push layout updates to React Flow, animating position changes
  const displayed = useRef<Snapshot | null>(null);
  const previousDirection = useRef(layoutDirection);
  const frame = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;

    const from = displayed.current;
    const directionChanged = previousDirection.current !== layoutDirection;
    previousDirection.current = layoutDirection;
    const sameStructure =
      !!from &&
      from.positions.size === rfNodes.length &&
      rfNodes.every((node) => from.positions.has(node.id));
    const moved =
      sameStructure &&
      rfNodes.some((node) => {
        const previous = from!.positions.get(node.id)!;
        return (
          Math.abs(previous.x - node.position.x) > 1 ||
          Math.abs(previous.y - node.position.y) > 1
        );
      });

    if (from && useFitView && (!sameStructure || directionChanged)) {
      // Fit the destination bounds right away so the camera moves together
      // with the nodes
      fitNodes(rfNodes, sameStructure ? ANIMATION_DURATION : 0);
    }

    if (!moved || prefersReducedMotion()) {
      setNodes(rfNodes);
      setEdges(rfEdges);
      displayed.current = snapshotOf(rfNodes, rfEdges);
      return;
    }

    const started = performance.now();
    const resized = new Set(
      rfNodes
        .filter(
          (node) =>
            from!.sizes.get(node.id) !==
            `${node.style?.width}x${node.style?.height}`,
        )
        .map((node) => node.id),
    );

    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / ANIMATION_DURATION);
      const t = easingFunctions.easeInOutCubic(progress);
      const positions = new Map<string, Point>();
      const pointsById = new Map<string, Point[] | undefined>();

      setNodes(
        rfNodes.map((node) => {
          const start = from!.positions.get(node.id) ?? node.position;
          const position =
            progress >= 1
              ? node.position
              : {
                  x: lerp(start.x, node.position.x, t),
                  y: lerp(start.y, node.position.y, t),
                };
          positions.set(node.id, position);
          return progress >= 1 ? node : { ...node, position };
        }),
      );

      setEdges(
        rfEdges.map((edge) => {
          const target = edge.data?.points;
          const start = from!.points.get(edge.id);
          if (progress >= 1) {
            pointsById.set(edge.id, target);
            return edge;
          }
          const compatible =
            !directionChanged &&
            target &&
            start &&
            start.length === target.length &&
            !resized.has(edge.source) &&
            !resized.has(edge.target);
          const points = compatible
            ? target!.map((point, i) => ({
                x: lerp(start![i].x, point.x, t),
                y: lerp(start![i].y, point.y, t),
              }))
            : undefined;
          pointsById.set(edge.id, points);
          return { ...edge, data: { ...edge.data!, points } };
        }),
      );

      displayed.current = {
        positions,
        sizes: snapshotOf(rfNodes, []).sizes,
        points: pointsById,
      };
      frame.current = progress < 1 ? requestAnimationFrame(step) : null;
    };
    frame.current = requestAnimationFrame(step);
  }, [
    rfNodes,
    rfEdges,
    fitNodes,
    layoutDirection,
    useFitView,
    setNodes,
    setEdges,
  ]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  // Remember dragged positions; drop the routed bend points of moved edges
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const moved = new Set<string>();
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          dragOverrides.current.set(change.id, change.position);
          moved.add(change.id);
        }
      }
      onNodesChange(changes);
      if (moved.size > 0) {
        setEdges((current) =>
          current.map((edge) =>
            edge.data?.points &&
            (moved.has(edge.source) || moved.has(edge.target))
              ? { ...edge, data: { ...edge.data, points: undefined } }
              : edge,
          ),
        );
      }
    },
    [onNodesChange, setEdges],
  );

  const focusPoint = useCallback(
    (point: Point, duration = 500) => {
      const area = getViewArea();
      if (!rfInstance || !area) return;
      const zoom = Math.min(Math.max(rfInstance.getZoom(), 0.9), 1.5);
      rfInstance.setViewport(
        {
          x: area.left + area.width / 2 - point.x * zoom,
          y: area.top + area.height / 2 - point.y * zoom,
          zoom,
        },
        { duration },
      );
    },
    [rfInstance, getViewArea],
  );

  const graphNodesRef = useRef(visibleNodes);
  graphNodesRef.current = visibleNodes;

  useImperativeHandle(
    ref,
    () => ({
      fitView: (options) =>
        fitNodes(rfNodesRef.current, options?.duration ?? 400),
      focusState: (stateId, options) => {
        const located = locateState(graphNodesRef.current, stateId);
        if (located) focusPoint(located.center, options?.duration);
      },
    }),
    [fitNodes, focusPoint],
  );

  // Center the active search match; reset the view when search is cleared
  const matchesRef = useRef(matches);
  matchesRef.current = matches;
  const previousSearch = useRef(searchTerm);
  useEffect(() => {
    if (!rfInstance) return;
    const current = matchesRef.current;
    if (searchTerm.trim() && current.length > 0) {
      const index =
        ((searchMatchIndex % current.length) + current.length) % current.length;
      focusPoint(current[index].center);
    } else if (!searchTerm.trim() && previousSearch.current.trim()) {
      fitNodes(rfNodesRef.current, 500);
    }
    previousSearch.current = searchTerm;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, searchMatchIndex, rfInstance]);

  const miniMapNodeColor = useCallback(
    (node: Node<StateNodeData>) => {
      const stateNode = node.data?.stateNode;
      if (!stateNode) return theme.connectionColor;
      if (stateNode.id === START_NODE_ID) return theme.startNodeColor;
      if (isArtificialNode(stateNode.id)) return theme.endNodeColor;
      return (
        theme.nodeBorderColors?.[getNodeKind(stateNode)] ?? theme.borderColor
      );
    },
    [theme],
  );

  const themeStyle = useMemo(() => themeToCssVars(theme), [theme]);

  return (
    <div
      ref={wrapperRef}
      className={classNames("asl-root", "asl-canvas", className)}
      style={{ ...themeStyle, width, height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setRfInstance}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={isDraggable}
        nodesConnectable={isConnectable}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={isSelectable}
        connectionMode={ConnectionMode.Strict}
        minZoom={0.1}
        maxZoom={2}
        zoomOnScroll={useZoom}
        zoomOnPinch={useZoom}
        zoomOnDoubleClick={useZoom}
        panOnScroll={useZoom}
        panOnDrag={useZoom}
        selectNodesOnDrag={false}
        selectionOnDrag={false}
        multiSelectionKeyCode={isMultiSelect ? "Shift" : null}
        selectionKeyCode={isMultiSelect ? "Shift" : null}
        connectOnClick={false}
        onlyRenderVisibleElements={nodes.length > LARGE_GRAPH_THRESHOLD}
        proOptions={{ hideAttribution: true }}
      >
        {useBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.2}
            color={theme.borderColor}
          />
        )}
        {useControls && (
          <Controls
            showInteractive={false}
            showZoom={useZoom}
            showFitView={useFitView}
            fitViewOptions={{ ...FIT_VIEW_OPTIONS, duration: 400 }}
            onFitView={() => fitNodes(rfNodesRef.current, 400)}
          />
        )}
        {useMiniMap && (
          <MiniMap
            nodeColor={miniMapNodeColor}
            nodeStrokeWidth={0}
            nodeBorderRadius={6}
            maskColor={withAlpha(theme.background, 0.65)}
            maskStrokeColor={theme.selectedNodeColor}
            maskStrokeWidth={1.5}
            zoomable={useZoom}
            pannable={useZoom}
            ariaLabel="Workflow overview"
            style={{ width: 168, height: 112 }}
          />
        )}
      </ReactFlow>
    </div>
  );
});

ReactFlowRenderer.displayName = "ReactFlowRenderer";
