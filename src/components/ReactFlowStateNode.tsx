import React, { useCallback, useMemo } from "react";
import { Handle, Position } from "reactflow";
import { IconRepeat, IconShieldX } from "@tabler/icons-react";

import { StateNode } from "../types";
import {
  END_NODE_ID,
  START_NODE_ID,
  getNodeKind,
  getStateSubtitle,
} from "../core/asl-utils";
import { StateIcon } from "./utils";
import {
  StateNodeComponentProps,
  areNodePropsEqual,
  classNames,
} from "./flow-types";

export type ReactFlowStateNodeProps = StateNodeComponentProps;

/**
 * Keyboard + mouse activation shared by every clickable state element.
 */
export function useActivate(
  stateNode: StateNode,
  onStateClick?: (state: StateNode) => void,
) {
  const onClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onStateClick?.(stateNode);
    },
    [onStateClick, stateNode],
  );
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        onStateClick?.(stateNode);
      }
    },
    [onStateClick, stateNode],
  );
  return { onClick, onKeyDown };
}

/**
 * Invisible handles used as edge anchors.
 */
export const NodeHandles: React.FC<{
  sourcePosition?: Position;
  targetPosition?: Position;
}> = ({ sourcePosition = Position.Bottom, targetPosition = Position.Top }) => (
  <>
    <Handle
      type="target"
      position={targetPosition}
      className="asl-handle"
      isConnectable={false}
    />
    <Handle
      type="source"
      position={sourcePosition}
      className="asl-handle"
      isConnectable={false}
    />
  </>
);

const TerminalNode: React.FC<StateNodeComponentProps> = ({
  data,
  sourcePosition,
  targetPosition,
}) => {
  const isStart = data.stateNode.id === START_NODE_ID;
  return (
    <div
      className={classNames(
        "asl-terminal",
        isStart ? "asl-terminal--start" : "asl-terminal--end",
        data.isDimmed && "is-dimmed",
      )}
      role="img"
      aria-label={isStart ? "Workflow start" : "Workflow end"}
    >
      <StateIcon stateNode={data.stateNode} size={12} />
      <span>{isStart ? "Start" : "End"}</span>
      <NodeHandles
        sourcePosition={sourcePosition}
        targetPosition={targetPosition}
      />
    </div>
  );
};

/**
 * Card used to render a single state in the graph.
 */
export const ReactFlowStateNode: React.FC<ReactFlowStateNodeProps> = React.memo(
  function ReactFlowStateNode(props) {
    const { data, selected, sourcePosition, targetPosition } = props;
    const { stateNode, onStateClick } = data;
    const { onClick, onKeyDown } = useActivate(stateNode, onStateClick);
    const definition = stateNode.definition;
    const subtitle = useMemo(() => getStateSubtitle(definition), [definition]);

    if (stateNode.id === START_NODE_ID || stateNode.id === END_NODE_ID) {
      return <TerminalNode {...props} />;
    }

    const retries = Array.isArray(definition.Retry)
      ? definition.Retry.length
      : 0;
    const catches = Array.isArray(definition.Catch)
      ? definition.Catch.length
      : 0;
    const tooltip = definition.Comment
      ? `${stateNode.name}\n${definition.Comment}`
      : stateNode.name;

    return (
      <div
        className={classNames(
          "asl-node",
          `asl-kind-${getNodeKind(stateNode)}`,
          (data.isSelected || selected) && "is-selected",
          data.isHighlighted && "is-highlighted",
          data.isActiveMatch && "is-active-match",
          data.isDimmed && "is-dimmed",
        )}
        role="button"
        tabIndex={0}
        aria-label={`${stateNode.type} state ${stateNode.name}`}
        aria-pressed={data.isSelected ? true : undefined}
        title={tooltip}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        <span className="asl-node__icon">
          <StateIcon stateNode={stateNode} />
        </span>
        <span className="asl-node__text">
          <span className="asl-node__name">{stateNode.name}</span>
          <span className="asl-node__meta">{subtitle}</span>
        </span>
        {(retries > 0 || catches > 0) && (
          <span className="asl-node__badges">
            {retries > 0 && (
              <span
                className="asl-badge asl-badge--retry"
                title={`${retries} retry polic${retries === 1 ? "y" : "ies"}`}
              >
                <IconRepeat size={11} stroke={2.2} aria-hidden />
                {retries}
              </span>
            )}
            {catches > 0 && (
              <span
                className="asl-badge asl-badge--catch"
                title={`${catches} catcher${catches === 1 ? "" : "s"}`}
              >
                <IconShieldX size={11} stroke={2.2} aria-hidden />
                {catches}
              </span>
            )}
          </span>
        )}
        <NodeHandles
          sourcePosition={sourcePosition}
          targetPosition={targetPosition}
        />
      </div>
    );
  },
  areNodePropsEqual,
);

ReactFlowStateNode.displayName = "ReactFlowStateNode";
