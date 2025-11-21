import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";

import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  BackgroundVariant,
} from "reactflow";
import { Controls } from "@reactflow/controls";
import { Background } from "@reactflow/background";
import { MiniMap } from "@reactflow/minimap";
import "reactflow/dist/style.css";

import { StateNode, Connection, ViewerTheme } from "../types";
import { ReactFlowStateNode } from "./ReactFlowStateNode";
import { ReactFlowGroupNode } from "./ReactFlowGroupNode";
import {
  calculateReactiveLayout,
  LayoutCache,
  NodeAnimationManager,
  ANIMATION_DURATION,
} from "../core/layout";

interface ReactFlowRendererProps {
  nodes: StateNode[];
  edges: Connection[];
  width: number;
  height: number;
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
}

const nodeTypes = {
  stateNode: ReactFlowStateNode,
  groupNode: ReactFlowGroupNode,
};

export const ReactFlowRenderer: React.FC<ReactFlowRendererProps> = ({
  nodes: stateNodes,
  edges: connections,
  width,
  height,
  theme,
  onStateClick,
  isConnectable = true,
  isDraggable = true,
  isSelectable = true,
  isMultiSelect = false,
  useMiniMap = false,
  useControls = true,
  useBackground = true,
  useZoom = true,
  useFitView = true,
  layoutDirection = "TB",
}) => {
  // State to track which group nodes are expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Layout cache for storing original positions and managing reactive layout
  const layoutCacheRef = useRef<LayoutCache>({
    originalPositions: new Map(),
    expandedNodes: new Set(),
  });

  // Reset layout cache when nodes or layout direction change significantly
  useEffect(() => {
    layoutCacheRef.current = {
      originalPositions: new Map(),
      expandedNodes: new Set(),
    };
    previousLayoutRef.current = [];
    setExpandedNodes(new Set());
  }, [stateNodes.length, layoutDirection]);

  // Animation manager for smooth transitions
  const animationManagerRef = useRef<NodeAnimationManager>(
    new NodeAnimationManager(),
  );

  // State for animation positions (used during transitions)
  const [animatingPositions, setAnimatingPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const [isAnimating, setIsAnimating] = useState(false);

  // Store previous layout to detect changes for animation
  const previousLayoutRef = useRef<StateNode[]>([]);

  // Function to toggle the expanded state of a group node with animation
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Calculate reactive layout with proper spacing adjustments
  const reactiveLayoutNodes = useMemo(() => {
    return calculateReactiveLayout(
      stateNodes,
      connections,
      expandedNodes,
      layoutCacheRef.current,
      layoutDirection,
    );
  }, [stateNodes, connections, expandedNodes, layoutDirection]);

  // Effect to animate layout changes
  useEffect(() => {
    const currentLayout = reactiveLayoutNodes;
    const previousLayout = previousLayoutRef.current;

    // Only animate if we have a previous layout and it's different
    if (
      previousLayout.length > 0 &&
      previousLayout.length === currentLayout.length
    ) {
      // Check if positions have changed
      const hasPositionChanges = currentLayout.some((currentNode) => {
        const previousNode = previousLayout.find(
          (p) => p.id === currentNode.id,
        );
        return (
          previousNode &&
          (Math.abs(currentNode.position.x - previousNode.position.x) > 1 ||
            Math.abs(currentNode.position.y - previousNode.position.y) > 1)
        );
      });

      if (hasPositionChanges) {
        // Start animation
        setIsAnimating(true);
        animationManagerRef.current.startAnimation(
          previousLayout,
          currentLayout,
          ANIMATION_DURATION,
          (progress, positions) => {
            setAnimatingPositions(new Map(positions));
            if (progress >= 1) {
              setIsAnimating(false);
            }
          },
        );
      }
    }

    // Update previous layout reference
    previousLayoutRef.current = [...currentLayout];
  }, [reactiveLayoutNodes]);

  // Update state nodes with current expanded state
  const updatedStateNodes = useMemo(() => {
    return reactiveLayoutNodes.map((node) => {
      // Use animated position if animation is running
      const animatedPosition = isAnimating
        ? animatingPositions.get(node.id)
        : null;
      const position = animatedPosition || node.position;

      if (node.isGroup) {
        return {
          ...node,
          position,
          isExpanded: expandedNodes.has(node.id),
        };
      }
      return {
        ...node,
        position,
      };
    });
  }, [reactiveLayoutNodes, expandedNodes, isAnimating, animatingPositions]);

  // Convert StateNode[] to ReactFlow Node[]
  const reactFlowNodes: Node[] = useMemo(() => {
    // Get all child node IDs that are being rendered inside group nodes
    const childNodeIds = new Set<string>();
    updatedStateNodes.forEach((node) => {
      if (node.isGroup && node.children) {
        node.children.forEach((child) => childNodeIds.add(child.id));
      }
    });

    // Filter nodes based on expand/collapse state
    const visibleNodes = updatedStateNodes.filter((stateNode) => {
      // Never show child nodes as separate ReactFlow nodes - they are rendered inside groups
      if (childNodeIds.has(stateNode.id)) return false;

      // Always show group nodes
      if (stateNode.isGroup) return true;

      // Show other nodes that don't have a parent (root nodes)
      return !stateNode.parentId;
    });

    return visibleNodes.map((stateNode) => ({
      id: stateNode.id,
      type: stateNode.isGroup ? "groupNode" : "stateNode",
      position: stateNode.position,
      zIndex: stateNode.isExpanded ? 1000 : stateNode.isGroup ? 10 : 1,
      data: {
        stateNode,
        theme,
        onStateClick,
        onToggleExpand: handleToggleExpand,
        children: stateNode.children || [],
      },
      // Use width and height properties directly instead of style
      width: stateNode.size.width,
      height: stateNode.size.height,
      style: {
        width: stateNode.size.width,
        height: stateNode.size.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "nowrap",
      },
      draggable: isDraggable,
    }));
  }, [
    updatedStateNodes,
    theme,
    onStateClick,
    expandedNodes,
    handleToggleExpand,
  ]);

  // Convert Connection[] to ReactFlow Edge[]
  const reactFlowEdges: Edge[] = useMemo(() => {
    // Get all child node IDs that are being rendered inside group nodes
    const childNodeIds = new Set<string>();
    updatedStateNodes.forEach((node) => {
      if (node.isGroup && node.children) {
        node.children.forEach((child) => childNodeIds.add(child.id));
      }
    });

    // Get the IDs of visible nodes (excluding children that are rendered inside groups)
    const visibleNodeIds = new Set(
      updatedStateNodes
        .filter((stateNode) => {
          // Never include child nodes as they are rendered inside groups
          if (childNodeIds.has(stateNode.id)) return false;
          if (stateNode.isGroup) return true;
          return !stateNode.parentId;
        })
        .map((node) => node.id),
    );

    // Filter connections to only include those between visible nodes
    const visibleConnections = connections.filter(
      (connection) =>
        visibleNodeIds.has(connection.from) &&
        visibleNodeIds.has(connection.to),
    );

    return visibleConnections.map((connection, index) => {
      const edgeStyle = getEdgeStyle(connection, theme);

      return {
        id: `${connection.from}-${connection.to}-${index}`,
        source: connection.from,
        target: connection.to,
        type: "smoothstep",
        style: edgeStyle.style,
        label: connection.label,
        labelStyle: edgeStyle.labelStyle,
        labelShowBg: true,
        labelBgStyle: edgeStyle.labelBgStyle,
        markerEnd: {
          type: "arrowclosed" as any,
          color: edgeStyle.style.stroke,
        },
        animated: connection.type === "error" || connection.type === "retry",
      };
    });
  }, [connections, theme, updatedStateNodes, expandedNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Update nodes when stateNodes change
  React.useEffect(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  // Update edges when connections change
  React.useEffect(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);

  // Cleanup animation on unmount
  React.useEffect(() => {
    return () => {
      animationManagerRef.current.stopAnimation();
    };
  }, []);

  const onConnect = useCallback(() => {
    // Prevent manual connections in readonly mode
  }, []);

  return (
    <div
      style={{
        width,
        height,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: "4px",
        overflow: "hidden",
        background: theme.background,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        nodesDraggable={isDraggable}
        connectionMode={ConnectionMode.Strict}
        fitView={useFitView}
        zoomOnScroll={useZoom}
        zoomOnPinch={useZoom}
        panOnScroll={useZoom}
        panOnDrag={useZoom}
        multiSelectionKeyCode={isMultiSelect ? "Shift" : null}
        selectNodesOnDrag={isSelectable}
        connectOnClick={isConnectable}
        nodesConnectable={isConnectable}
        selectionOnDrag={isSelectable}
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 2,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ background: theme.background }}
        proOptions={{ hideAttribution: true }}
      >
        {useBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={theme.borderColor}
          />
        )}
        {useControls && (
          <Controls
            showInteractive={isDraggable}
            showZoom={useZoom}
            showFitView={useFitView}
          />
        )}
        {useMiniMap && (
          <MiniMap
            nodeColor={theme.nodeColors.task}
            nodeStrokeColor={theme.borderColor}
            maskColor={`${theme.background}90`}
            zoomable={useZoom}
            pannable={useZoom}
            inversePan={true}
            style={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.borderColor}`,
              width: 150,
              height: 100,
              borderRadius: "4px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          />
        )}
      </ReactFlow>
    </div>
  );
};

function getEdgeStyle(connection: Connection, theme: ViewerTheme) {
  let strokeColor = theme.connectionColor;
  let strokeWidth = 2;
  let strokeDasharray = "none";
  let animation = undefined;

  switch (connection.type) {
    case "error":
      strokeColor = theme.errorColor;
      strokeDasharray = "5,5";
      break;
    case "retry":
      strokeColor = theme.warningColor;
      strokeDasharray = "5,5";
      break;
    case "choice":
      strokeColor = theme.infoColor;
      break;
    case "default":
      strokeColor = theme.textColorMuted;
      strokeWidth = 1.5;
      strokeDasharray = "3,3";
      break;
    case "next":
    default:
      strokeColor = theme.connectionColor;
      break;
  }

  return {
    style: {
      stroke: strokeColor,
      strokeWidth,
      strokeDasharray,
    },
    labelStyle: {
      fill: theme.textColor,
      fontSize: "12px",
      fontWeight: 600,
      fontFamily: "'Inter', sans-serif",
    },
    labelBgStyle: {
      fill: theme.background,
      fillOpacity: 0.8,
      rx: 4,
      ry: 4,
    },
  };
}
