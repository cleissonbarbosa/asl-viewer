import React, { useMemo, useCallback } from 'react';

import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  BackgroundVariant,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { StateNode, Connection, ViewerTheme } from '../types';
import { ReactFlowStateNode } from './ReactFlowStateNode';

interface ReactFlowRendererProps {
  nodes: StateNode[];
  edges: Connection[];
  width: number;
  height: number;
  theme: ViewerTheme;
  onStateClick?: (state: StateNode) => void;
}

const nodeTypes = {
  stateNode: ReactFlowStateNode,
};

export const ReactFlowRenderer: React.FC<ReactFlowRendererProps> = ({
  nodes: stateNodes,
  edges: connections,
  width,
  height,
  theme,
  onStateClick
}) => {
  // Convert StateNode[] to ReactFlow Node[]
  const reactFlowNodes: Node[] = useMemo(() => {
    return stateNodes.map((stateNode) => ({
      id: stateNode.id,
      type: 'stateNode',
      position: stateNode.position,
      data: {
        stateNode,
        theme,
        onStateClick,
      },
      style: {
        width: stateNode.size.width,
        height: stateNode.size.height,
      },
    }));
  }, [stateNodes, theme, onStateClick]);

  // Convert Connection[] to ReactFlow Edge[]
  const reactFlowEdges: Edge[] = useMemo(() => {
    return connections.map((connection, index) => {
      const edgeStyle = getEdgeStyle(connection, theme);
      
      return {
        id: `${connection.from}-${connection.to}-${index}`,
        source: connection.from,
        target: connection.to,
        type: 'smoothstep',
        style: edgeStyle.style,
        label: connection.label,
        labelStyle: edgeStyle.labelStyle,
        markerEnd: {
          type: 'arrowclosed' as any,
        },
        animated: connection.type === 'error' || connection.type === 'retry',
      };
    });
  }, [connections, theme]);

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

  const onConnect = useCallback(() => {
    // Prevent manual connections in readonly mode
  }, []);

  return (
    <div 
      style={{ 
        width, 
        height,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: '4px',
        overflow: 'hidden',
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
        connectionMode={ConnectionMode.Strict}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 2,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ background: theme.background }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color={theme.borderColor}
        />
        <Controls />
        <MiniMap 
          nodeColor={theme.nodeColors.task}
          nodeStrokeColor={theme.borderColor}
          maskColor={`${theme.background}90`}
          style={{
            backgroundColor: theme.background,
            border: `1px solid ${theme.borderColor}`,
          }}
        />
      </ReactFlow>
    </div>
  );
};

function getEdgeStyle(connection: Connection, theme: ViewerTheme) {
  let strokeColor = theme.connectionColor;
  let strokeWidth = 2;
  let strokeDasharray = 'none';

  switch (connection.type) {
    case 'error':
      strokeColor = theme.errorColor;
      strokeDasharray = '5,5';
      break;
    case 'retry':
      strokeColor = '#ff9800';
      strokeDasharray = '5,5';
      break;
    case 'choice':
      strokeColor = '#2196f3';
      break;
    case 'default':
      strokeColor = '#9e9e9e';
      strokeWidth = 1;
      break;
    case 'next':
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
      fontSize: '14px',
      fontWeight: 'bold',
      background: theme.background,
      padding: '4px 8px',
    },
  };
}
