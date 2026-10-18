import React, { useCallback, useMemo } from "react";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

import { StateNode } from "../types";
import { getNodeKind, getStateSubtitle } from "../core/asl-utils";
import { GROUP_LAYOUT, groupChildrenByBranch } from "../core/layout";
import { StateIcon } from "./utils";
import { NodeHandles, useActivate } from "./ReactFlowStateNode";
import {
  StateNodeComponentProps,
  areNodePropsEqual,
  classNames,
} from "./flow-types";

export type ReactFlowGroupNodeProps = StateNodeComponentProps;

const ChildCard: React.FC<{
  child: StateNode;
  onStateClick?: (state: StateNode) => void;
  isHighlighted: boolean;
  isSelected: boolean;
}> = React.memo(function ChildCard({
  child,
  onStateClick,
  isHighlighted,
  isSelected,
}) {
  const { onClick, onKeyDown } = useActivate(child, onStateClick);
  return (
    <div
      className={classNames(
        "asl-child",
        `asl-kind-${getNodeKind(child)}`,
        isHighlighted && "is-highlighted",
        isSelected && "is-selected",
      )}
      style={{ height: GROUP_LAYOUT.childHeight }}
      role="button"
      tabIndex={0}
      aria-label={`${child.type} state ${child.name}`}
      title={child.name}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span className="asl-child__icon">
        <StateIcon stateNode={child} size={14} />
      </span>
      <span className="asl-child__text">
        <span className="asl-child__name">{child.name}</span>
        <span className="asl-child__meta">
          {getStateSubtitle(child.definition)}
        </span>
      </span>
    </div>
  );
});

/**
 * Parallel / Map state. Collapsed it looks like a stacked card; expanded it
 * shows its branches (or item processor) inline.
 */
export const ReactFlowGroupNode: React.FC<ReactFlowGroupNodeProps> = React.memo(
  function ReactFlowGroupNode({
    data,
    selected,
    sourcePosition,
    targetPosition,
  }) {
    const {
      stateNode,
      onStateClick,
      onToggleExpand,
      highlightedIds,
      selectedId,
    } = data;
    const { onClick, onKeyDown } = useActivate(stateNode, onStateClick);
    const isExpanded = !!stateNode.isExpanded;
    const children = useMemo(
      () => stateNode.children ?? [],
      [stateNode.children],
    );
    const isParallel = stateNode.type === "Parallel";

    const columns = useMemo(
      () =>
        isParallel
          ? Array.from(groupChildrenByBranch(children).entries())
          : ([[0, children]] as Array<[number, StateNode[]]>),
      [children, isParallel],
    );

    const handleToggle = useCallback(
      (event: React.MouseEvent | React.KeyboardEvent) => {
        event.stopPropagation();
        onToggleExpand?.(stateNode.id);
      },
      [onToggleExpand, stateNode.id],
    );

    const summary = isParallel
      ? getStateSubtitle(stateNode.definition)
      : `${getStateSubtitle(stateNode.definition)} · ${children.length} state${children.length === 1 ? "" : "s"}`;

    return (
      <div
        className={classNames(
          "asl-group",
          `asl-kind-${getNodeKind(stateNode)}`,
          isExpanded ? "is-expanded" : "is-collapsed",
          (data.isSelected || selected) && "is-selected",
          data.isHighlighted && "is-highlighted",
          data.isActiveMatch && "is-active-match",
          data.isDimmed && "is-dimmed",
        )}
      >
        <div
          className="asl-node asl-group__header"
          style={{ height: GROUP_LAYOUT.headerHeight }}
          role="button"
          tabIndex={0}
          aria-label={`${stateNode.type} state ${stateNode.name}`}
          title={
            stateNode.definition.Comment
              ? `${stateNode.name}\n${stateNode.definition.Comment}`
              : stateNode.name
          }
          onClick={onClick}
          onKeyDown={onKeyDown}
        >
          <span className="asl-node__icon">
            <StateIcon stateNode={stateNode} />
          </span>
          <span className="asl-node__text">
            <span className="asl-node__name">{stateNode.name}</span>
            <span className="asl-node__meta">{summary}</span>
          </span>
          <button
            type="button"
            className="asl-group__toggle nodrag"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${stateNode.name}`}
            title={isExpanded ? "Collapse" : "Expand"}
            onClick={handleToggle}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {isExpanded ? (
              <IconChevronDown size={16} aria-hidden />
            ) : (
              <IconChevronRight size={16} aria-hidden />
            )}
          </button>
        </div>

        {isExpanded && (
          <div
            className="asl-group__body"
            style={{
              padding: GROUP_LAYOUT.padding,
              gap: GROUP_LAYOUT.columnGap,
            }}
          >
            {children.length === 0 ? (
              <div className="asl-group__empty">No states</div>
            ) : (
              columns.map(([branchIndex, branchChildren]) => (
                <div
                  key={branchIndex}
                  className="asl-group__column"
                  style={{ width: GROUP_LAYOUT.columnWidth }}
                >
                  <div
                    className="asl-group__label"
                    style={{ height: GROUP_LAYOUT.columnLabelHeight }}
                  >
                    {isParallel
                      ? `Branch ${branchIndex + 1}`
                      : "Item processor"}
                  </div>
                  {branchChildren.map((child, index) => (
                    <React.Fragment key={child.id}>
                      {index > 0 && (
                        <div
                          className="asl-group__connector"
                          style={{ height: GROUP_LAYOUT.childGap }}
                          aria-hidden
                        />
                      )}
                      <ChildCard
                        child={child}
                        onStateClick={onStateClick}
                        isHighlighted={!!highlightedIds?.has(child.id)}
                        isSelected={selectedId === child.id}
                      />
                    </React.Fragment>
                  ))}
                </div>
              ))
            )}
          </div>
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

ReactFlowGroupNode.displayName = "ReactFlowGroupNode";
