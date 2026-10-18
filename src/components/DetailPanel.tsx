import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconX,
} from "@tabler/icons-react";
import {
  CatchDefinition,
  RetryDefinition,
  StateDefinition,
  StateNode,
  ViewerTheme,
} from "../types";
import {
  describeResource,
  formatChoiceCondition,
  getItemProcessor,
  getNodeKind,
  isDistributedMap,
  isNestedExecution,
} from "../core/asl-utils";
import { StateIcon } from "./utils";
import { JsonView } from "./JsonView";
import { themeToCssVars } from "./theme-vars";
import { classNames } from "./flow-types";

export interface DetailPanelProps {
  node: StateNode;
  theme: ViewerTheme;
  onClose: () => void;
  /** Called with a state name when a transition target is clicked. */
  onNavigate?: (stateName: string) => void;
  className?: string;
}

const RAW_JSON_COLLAPSE_THRESHOLD = 4000;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="asl-section">
    <h4 className="asl-section__title">{title}</h4>
    {children}
  </section>
);

type Row = [label: string, value: React.ReactNode, mono?: boolean];

const KeyValues: React.FC<{ rows: Row[] }> = ({ rows }) => {
  const visible = rows.filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  if (visible.length === 0) return null;
  return (
    <dl className="asl-kv">
      {visible.map(([label, value, mono]) => (
        <React.Fragment key={label}>
          <dt>{label}</dt>
          <dd className={mono ? "asl-mono" : undefined}>
            {typeof value === "object" && !React.isValidElement(value)
              ? JSON.stringify(value)
              : value}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
};

const StateLink: React.FC<{
  name: string;
  onNavigate?: (stateName: string) => void;
}> = ({ name, onNavigate }) => (
  <button
    type="button"
    className="asl-link"
    onClick={() => onNavigate?.(name)}
    disabled={!onNavigate}
    title={onNavigate ? `Go to ${name}` : undefined}
  >
    <IconArrowRight size={13} aria-hidden />
    {name}
  </button>
);

const Chips: React.FC<{ values?: string[] }> = ({ values }) =>
  values && values.length > 0 ? (
    <div>
      {values.map((value) => (
        <span key={value} className="asl-chip" title={value}>
          {value}
        </span>
      ))}
    </div>
  ) : null;

function seconds(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === "number" ? `${value}s` : String(value);
}

function retrySummary(retry: RetryDefinition): string {
  const parts: string[] = [];
  parts.push(`${retry.MaxAttempts ?? 3} attempts`);
  parts.push(`${retry.IntervalSeconds ?? 1}s interval`);
  parts.push(`×${retry.BackoffRate ?? 2} backoff`);
  if (retry.MaxDelaySeconds !== undefined)
    parts.push(`max delay ${retry.MaxDelaySeconds}s`);
  if (retry.JitterStrategy) parts.push(`jitter ${retry.JitterStrategy}`);
  return parts.join(" · ");
}

function getOverviewRows(def: StateDefinition): Row[] {
  const rows: Row[] = [];
  switch (def.Type) {
    case "Task": {
      const resource = describeResource(def.Resource);
      if (resource) {
        rows.push([
          "Service",
          [resource.service, resource.action].filter(Boolean).join(" · "),
        ]);
        if (resource.pattern) rows.push(["Pattern", resource.pattern]);
      }
      rows.push(["Resource", def.Resource, true]);
      break;
    }
    case "Wait":
      rows.push(["Seconds", seconds(def.Seconds)]);
      rows.push(["Seconds path", def.SecondsPath, true]);
      rows.push(["Timestamp", def.Timestamp, true]);
      rows.push(["Timestamp path", def.TimestampPath, true]);
      break;
    case "Map": {
      const processor = getItemProcessor(def);
      const config = def.ItemProcessor?.ProcessorConfig;
      rows.push([
        "Mode",
        isDistributedMap(def)
          ? `Distributed${config?.ExecutionType ? ` · ${config.ExecutionType}` : ""}`
          : "Inline",
      ]);
      rows.push(["Items path", def.ItemsPath, true]);
      rows.push(["Max concurrency", def.MaxConcurrency]);
      rows.push(["Max concurrency path", def.MaxConcurrencyPath, true]);
      rows.push(["Tolerated failures", def.ToleratedFailurePercentage]);
      rows.push(["Tolerated failure count", def.ToleratedFailureCount]);
      rows.push(["Label", def.Label]);
      if (processor?.States) {
        rows.push(["States", Object.keys(processor.States).length]);
      }
      break;
    }
    case "Parallel":
      rows.push(["Branches", def.Branches?.length ?? 0]);
      rows.push([
        "States",
        (def.Branches ?? []).reduce(
          (total, branch) => total + Object.keys(branch?.States ?? {}).length,
          0,
        ),
      ]);
      break;
    case "Fail":
      rows.push(["Error", def.Error, true]);
      rows.push(["Error path", def.ErrorPath, true]);
      rows.push(["Cause", def.Cause]);
      rows.push(["Cause path", def.CausePath, true]);
      break;
  }
  rows.push(["Timeout", seconds(def.TimeoutSeconds)]);
  rows.push(["Timeout path", def.TimeoutSecondsPath, true]);
  rows.push(["Heartbeat", seconds(def.HeartbeatSeconds)]);
  rows.push(["Heartbeat path", def.HeartbeatSecondsPath, true]);
  rows.push(["Query language", def.QueryLanguage]);
  return rows;
}

const DATA_FIELDS: Array<keyof StateDefinition> = [
  "InputPath",
  "Parameters",
  "Arguments",
  "ItemSelector",
  "ItemReader",
  "ItemBatcher",
  "Result",
  "ResultSelector",
  "ResultPath",
  "ResultWriter",
  "OutputPath",
  "Output",
  "Assign",
  "Items",
  "Credentials",
];

/**
 * Side panel with the details of the selected state.
 */
export const DetailPanel: React.FC<DetailPanelProps> = ({
  node,
  theme,
  onClose,
  onNavigate,
  className,
}) => {
  const def = node.definition;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setCopied(false);
    return () => clearTimeout(timer.current);
  }, [node]);

  const handleCopy = useCallback(() => {
    const text = JSON.stringify(def, null, 2);
    const done = () => {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    };
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done, () => undefined);
    }
  }, [def]);

  const kind = getNodeKind(node);
  const resource = def.Type === "Task" ? describeResource(def.Resource) : null;
  const dataFields = DATA_FIELDS.filter((field) => def[field] !== undefined);
  const rawJson = JSON.stringify(def, null, 2) ?? "";
  const retries: RetryDefinition[] = Array.isArray(def.Retry) ? def.Retry : [];
  const catchers: CatchDefinition[] = Array.isArray(def.Catch) ? def.Catch : [];

  return (
    <aside
      className={classNames("asl-panel", className)}
      style={themeToCssVars(theme)}
      aria-label={`Details of ${node.name}`}
    >
      <header className={classNames("asl-panel__header", `asl-kind-${kind}`)}>
        <span className="asl-node__icon">
          <StateIcon stateNode={node} size={20} />
        </span>
        <div className="asl-panel__heading">
          <h3 className="asl-panel__title">{node.name}</h3>
          <div className="asl-panel__tags">
            <span
              className="asl-tag"
              style={
                { "--asl-tag": "var(--asl-accent)" } as React.CSSProperties
              }
            >
              {node.type}
            </span>
            {isNestedExecution(def) && (
              <span
                className="asl-tag"
                style={
                  {
                    "--asl-tag": "var(--asl-stepfn-border)",
                  } as React.CSSProperties
                }
              >
                Step Function
              </span>
            )}
            {resource && !isNestedExecution(def) && (
              <span className="asl-tag">{resource.service}</span>
            )}
            {isDistributedMap(def) && (
              <span className="asl-tag">Distributed</span>
            )}
            {node.isStartState && (
              <span
                className="asl-tag"
                style={
                  { "--asl-tag": "var(--asl-start)" } as React.CSSProperties
                }
              >
                Start
              </span>
            )}
            {node.isEndState && (
              <span
                className="asl-tag"
                style={
                  {
                    "--asl-tag":
                      def.Type === "Fail"
                        ? "var(--asl-error)"
                        : "var(--asl-success)",
                  } as React.CSSProperties
                }
              >
                End
              </span>
            )}
          </div>
        </div>
        <div className="asl-panel__actions">
          <button
            type="button"
            className="asl-icon-btn"
            onClick={handleCopy}
            title={copied ? "Copied" : "Copy state definition"}
            aria-label="Copy state definition as JSON"
          >
            {copied ? (
              <IconCheck size={17} aria-hidden />
            ) : (
              <IconCopy size={17} aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="asl-icon-btn"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close details"
          >
            <IconX size={17} aria-hidden />
          </button>
        </div>
      </header>

      <div className="asl-panel__body">
        {def.Comment && (
          <Section title="Description">
            <p className="asl-description">{def.Comment}</p>
          </Section>
        )}

        {getOverviewRows(def).some(([, value]) => value !== undefined) && (
          <Section title="Overview">
            <KeyValues rows={getOverviewRows(def)} />
          </Section>
        )}

        {def.Type === "Choice" && (
          <Section title="Rules">
            <ol className="asl-list">
              {(def.Choices ?? []).map((choice, index) => (
                <li key={index} className="asl-list__item">
                  <div className="asl-list__head">
                    <span>Rule {index + 1}</span>
                    {choice?.Next && (
                      <StateLink name={choice.Next} onNavigate={onNavigate} />
                    )}
                  </div>
                  <div className="asl-list__condition">
                    {formatChoiceCondition(choice)}
                  </div>
                  {choice?.Comment && (
                    <div className="asl-list__meta">{choice.Comment}</div>
                  )}
                </li>
              ))}
              {def.Default && (
                <li className="asl-list__item">
                  <div className="asl-list__head" style={{ marginBottom: 0 }}>
                    <span>Default</span>
                    <StateLink name={def.Default} onNavigate={onNavigate} />
                  </div>
                </li>
              )}
            </ol>
          </Section>
        )}

        {def.Type !== "Choice" && (
          <Section title="Transition">
            {def.Next ? (
              <KeyValues
                rows={[
                  [
                    "Next",
                    <StateLink
                      key="next"
                      name={def.Next}
                      onNavigate={onNavigate}
                    />,
                  ],
                ]}
              />
            ) : (
              <p className="asl-description">
                {def.Type === "Fail"
                  ? "Fails the execution."
                  : def.Type === "Succeed"
                    ? "Completes the execution successfully."
                    : def.End
                      ? "Ends the execution."
                      : "No transition defined."}
              </p>
            )}
          </Section>
        )}

        {(retries.length > 0 || catchers.length > 0) && (
          <Section title="Error handling">
            <ul className="asl-list">
              {retries.map((retry, index) => (
                <li key={`retry-${index}`} className="asl-list__item">
                  <div className="asl-list__head">
                    <span>Retry {index + 1}</span>
                  </div>
                  <Chips values={retry?.ErrorEquals} />
                  <div className="asl-list__meta">{retrySummary(retry)}</div>
                </li>
              ))}
              {catchers.map((catcher, index) => (
                <li key={`catch-${index}`} className="asl-list__item">
                  <div className="asl-list__head">
                    <span>Catch {index + 1}</span>
                    {catcher?.Next && (
                      <StateLink name={catcher.Next} onNavigate={onNavigate} />
                    )}
                  </div>
                  <Chips values={catcher?.ErrorEquals} />
                  {catcher?.ResultPath !== undefined && (
                    <div className="asl-list__meta">
                      Result path{" "}
                      <span className="asl-mono">
                        {String(catcher.ResultPath)}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {dataFields.length > 0 && (
          <Section title="Data flow">
            {dataFields.map((field) => {
              const value = def[field];
              const isScalar = typeof value !== "object" || value === null;
              return (
                <div key={field} className="asl-field">
                  <span className="asl-field__label">{field}</span>
                  {isScalar ? (
                    <span className="asl-chip">{String(value)}</span>
                  ) : (
                    <JsonView value={value} />
                  )}
                </div>
              );
            })}
          </Section>
        )}

        <Section title="Definition">
          <details open={rawJson.length < RAW_JSON_COLLAPSE_THRESHOLD}>
            <summary
              className="asl-field__label"
              style={{ cursor: "pointer", marginBottom: 8 }}
            >
              Raw JSON · {rawJson.split("\n").length} lines
            </summary>
            <JsonView value={def} />
          </details>
        </Section>
      </div>
    </aside>
  );
};
