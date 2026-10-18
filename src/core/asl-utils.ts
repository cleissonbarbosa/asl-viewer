import {
  ASLDefinition,
  ChoiceExpression,
  StateDefinition,
  StateNode,
  ViewerTheme,
} from "../types";

export type NodeKind = keyof ViewerTheme["nodeColors"];

export const START_NODE_ID = "__start__";
export const END_NODE_ID = "__end__";

export const STATE_TYPES = [
  "Pass",
  "Task",
  "Choice",
  "Wait",
  "Succeed",
  "Fail",
  "Parallel",
  "Map",
] as const;

export function isArtificialNode(id: string): boolean {
  return id === START_NODE_ID || id === END_NODE_ID;
}

/**
 * Returns the sub-workflow executed by a Map state, supporting both the
 * current `ItemProcessor` field and the legacy `Iterator` field.
 */
export function getItemProcessor(
  state: StateDefinition,
): ASLDefinition | undefined {
  const processor = state.ItemProcessor ?? state.Iterator;
  return processor && typeof processor === "object" ? processor : undefined;
}

export function isDistributedMap(state: StateDefinition): boolean {
  return state.ItemProcessor?.ProcessorConfig?.Mode === "DISTRIBUTED";
}

/**
 * True when a Task starts another Step Functions execution.
 */
export function isNestedExecution(state: StateDefinition): boolean {
  return (
    state.Type === "Task" &&
    typeof state.Resource === "string" &&
    state.Resource.includes("states:startExecution")
  );
}

/**
 * Maps a state to the theme color key used to render it.
 */
export function getNodeKind(
  node: Pick<StateNode, "type" | "definition">,
): NodeKind {
  if (isNestedExecution(node.definition)) return "stepFunction";
  const kind = String(node.type || "").toLowerCase();
  switch (kind) {
    case "pass":
    case "task":
    case "choice":
    case "wait":
    case "succeed":
    case "fail":
    case "parallel":
    case "map":
      return kind;
    default:
      return "pass";
  }
}

const SERVICE_NAMES: Record<string, string> = {
  lambda: "Lambda",
  dynamodb: "DynamoDB",
  sns: "SNS",
  sqs: "SQS",
  ses: "SES",
  sesv2: "SES",
  s3: "S3",
  ecs: "ECS",
  eks: "EKS",
  batch: "Batch",
  glue: "Glue",
  databrew: "DataBrew",
  athena: "Athena",
  states: "Step Functions",
  events: "EventBridge",
  sagemaker: "SageMaker",
  bedrock: "Bedrock",
  apigateway: "API Gateway",
  http: "HTTP",
  codebuild: "CodeBuild",
  elasticmapreduce: "EMR",
  "emr-serverless": "EMR Serverless",
  "emr-containers": "EMR on EKS",
  mediaconvert: "MediaConvert",
  secretsmanager: "Secrets Manager",
  ssm: "Systems Manager",
  kinesis: "Kinesis",
  firehose: "Firehose",
  cloudwatch: "CloudWatch",
  logs: "CloudWatch Logs",
  rds: "RDS",
  redshift: "Redshift",
  "redshift-data": "Redshift Data",
  ec2: "EC2",
  iam: "IAM",
  kms: "KMS",
  textract: "Textract",
  comprehend: "Comprehend",
  rekognition: "Rekognition",
  translate: "Translate",
  transcribe: "Transcribe",
  stepfunctions: "Step Functions",
  activity: "Activity",
};

export interface ResourceDescription {
  /** Lower-case service key, e.g. `lambda`, `dynamodb`, `states`. */
  serviceKey: string;
  /** Human readable service name, e.g. `DynamoDB`. */
  service: string;
  /** API action or resource name, e.g. `PutItem` or a function name. */
  action?: string;
  /** Integration pattern, e.g. `Wait for callback` or `Run a job`. */
  pattern?: string;
  /** True for `arn:aws:states:::aws-sdk:*` integrations. */
  sdk?: boolean;
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function serviceName(key: string): string {
  return SERVICE_NAMES[key] ?? capitalize(key);
}

const PATTERNS: Record<string, string> = {
  sync: "Run a job",
  "sync:2": "Run a job",
  waitForTaskToken: "Wait for callback",
};

/**
 * Turns a Task `Resource` into a short human readable description.
 *
 * @example
 * describeResource("arn:aws:states:::dynamodb:putItem")
 * // { serviceKey: "dynamodb", service: "DynamoDB", action: "PutItem" }
 */
export function describeResource(
  resource: unknown,
): ResourceDescription | null {
  if (typeof resource !== "string" || resource.trim() === "") return null;

  // Service integrations: arn:<partition>:states:::<service>:<action>[.<pattern>]
  const integration = resource.match(/^arn:[^:]+:states:::(.+)$/);
  if (integration) {
    let rest = integration[1];
    let sdk = false;
    if (rest.startsWith("aws-sdk:")) {
      sdk = true;
      rest = rest.slice("aws-sdk:".length);
    }
    const [key, ...actionParts] = rest.split(":");
    let action = actionParts.join(":");
    let pattern: string | undefined;
    const dot = action.indexOf(".");
    if (dot >= 0) {
      pattern = PATTERNS[action.slice(dot + 1)] ?? action.slice(dot + 1);
      action = action.slice(0, dot);
    }
    return {
      serviceKey: key.toLowerCase(),
      service: serviceName(key.toLowerCase()),
      action: action ? capitalize(action) : undefined,
      pattern,
      sdk,
    };
  }

  // Direct ARNs: arn:<partition>:<service>:<region>:<account>:<type>:<name>
  const arn = resource.match(/^arn:[^:]+:([^:]+):[^:]*:[^:]*:(.+)$/);
  if (arn) {
    const key = arn[1].toLowerCase();
    const parts = arn[2].split(":");
    // lambda: function:<name>[:<alias>], states: activity:<name>
    if (key === "states" && parts[0] === "activity") {
      return {
        serviceKey: "activity",
        service: "Activity",
        action: parts[1],
      };
    }
    const name = parts[0] === "function" ? parts[1] : parts[parts.length - 1];
    return { serviceKey: key, service: serviceName(key), action: name };
  }

  // Template placeholders such as ${MyFunctionArn}
  const placeholder = resource.match(/^\$\{(.+)\}$/);
  if (placeholder) {
    const looksLikeLambda = /lambda|function/i.test(placeholder[1]);
    return {
      serviceKey: looksLikeLambda ? "lambda" : "unknown",
      service: looksLikeLambda ? "Lambda" : "Resource",
      action: placeholder[1],
    };
  }

  return { serviceKey: "unknown", service: "Resource", action: resource };
}

function formatValue(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : String(value);
}

const OPERATORS: Array<[string, string]> = [
  ["Equals", "=="],
  ["LessThanEquals", "<="],
  ["GreaterThanEquals", ">="],
  ["LessThan", "<"],
  ["GreaterThan", ">"],
];

const TYPE_TESTS: Array<[keyof ChoiceExpression, string]> = [
  ["IsNull", "is null"],
  ["IsPresent", "is present"],
  ["IsNumeric", "is numeric"],
  ["IsString", "is string"],
  ["IsBoolean", "is boolean"],
  ["IsTimestamp", "is timestamp"],
];

/**
 * Formats a Choice rule (or nested expression) into a readable condition.
 *
 * @example
 * formatChoiceCondition({ Variable: "$.total", NumericGreaterThan: 100, Next: "X" })
 * // "$.total > 100"
 */
export function formatChoiceCondition(rule: ChoiceExpression): string {
  if (!rule || typeof rule !== "object") return "condition";

  if (typeof rule.Condition === "string") {
    return rule.Condition.replace(/^\{%\s*/, "")
      .replace(/\s*%\}$/, "")
      .trim();
  }

  if (Array.isArray(rule.And) && rule.And.length > 0) {
    return rule.And.map((r) => wrap(formatChoiceCondition(r))).join(" && ");
  }
  if (Array.isArray(rule.Or) && rule.Or.length > 0) {
    return rule.Or.map((r) => wrap(formatChoiceCondition(r))).join(" || ");
  }
  if (rule.Not) {
    return `!(${formatChoiceCondition(rule.Not)})`;
  }

  const variable = rule.Variable;
  if (!variable) return "condition";

  const record = rule as Record<string, unknown>;

  if (record.StringMatches !== undefined) {
    return `${variable} matches ${formatValue(record.StringMatches)}`;
  }

  for (const kind of ["String", "Numeric", "Boolean", "Timestamp"]) {
    for (const [suffix, symbol] of OPERATORS) {
      const key = `${kind}${suffix}`;
      if (record[key] !== undefined) {
        return `${variable} ${symbol} ${formatValue(record[key])}`;
      }
      if (record[`${key}Path`] !== undefined) {
        return `${variable} ${symbol} ${String(record[`${key}Path`])}`;
      }
    }
  }

  for (const [key, text] of TYPE_TESTS) {
    if (rule[key] !== undefined) {
      return rule[key] ? `${variable} ${text}` : `!(${variable} ${text})`;
    }
  }

  return "condition";
}

function wrap(expression: string): string {
  return /\s(&&|\|\|)\s/.test(expression) ? `(${expression})` : expression;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text;
}

function formatSeconds(value: unknown): string {
  if (typeof value === "number") {
    if (value >= 3600 && value % 3600 === 0) return `${value / 3600}h`;
    if (value >= 60 && value % 60 === 0) return `${value / 60}m`;
    return `${value}s`;
  }
  return String(value);
}

/**
 * Short secondary line displayed under the state name in the graph.
 */
export function getStateSubtitle(state: StateDefinition): string {
  switch (state.Type) {
    case "Task": {
      const description = describeResource(state.Resource);
      if (!description) return "Task";
      if (description.serviceKey === "states" && isNestedExecution(state)) {
        return "Step Functions · StartExecution";
      }
      return description.action
        ? `${description.service} · ${description.action}`
        : description.service;
    }
    case "Wait":
      if (state.Seconds !== undefined)
        return `Wait ${formatSeconds(state.Seconds)}`;
      if (state.SecondsPath) return `Wait ${state.SecondsPath}`;
      if (state.Timestamp) return `Until ${state.Timestamp}`;
      if (state.TimestampPath) return `Until ${state.TimestampPath}`;
      return "Wait";
    case "Choice": {
      const count = Array.isArray(state.Choices) ? state.Choices.length : 0;
      return `Choice · ${count} rule${count === 1 ? "" : "s"}`;
    }
    case "Parallel": {
      const count = Array.isArray(state.Branches) ? state.Branches.length : 0;
      return `Parallel · ${count} branch${count === 1 ? "" : "es"}`;
    }
    case "Map":
      return isDistributedMap(state) ? "Distributed map" : "Map · Inline";
    case "Fail":
      return state.Error ? `Fail · ${state.Error}` : "Fail";
    default:
      return state.Type || "State";
  }
}

/**
 * Returns the names of every state reachable from `startAt` following
 * Next / Choices / Default / Catch transitions, in visit order.
 */
export function orderStatesByFlow(definition: ASLDefinition): string[] {
  const states = definition?.States ?? {};
  const ordered: string[] = [];
  const seen = new Set<string>();
  const queue: string[] = definition?.StartAt ? [definition.StartAt] : [];

  for (let i = 0; i < queue.length; i++) {
    const name = queue[i];
    if (seen.has(name) || !states[name]) continue;
    seen.add(name);
    ordered.push(name);
    for (const next of getTransitions(states[name])) {
      if (!seen.has(next)) queue.push(next);
    }
  }

  for (const name of Object.keys(states)) {
    if (!seen.has(name)) ordered.push(name);
  }
  return ordered;
}

/**
 * Lists every state name a state can transition to.
 */
export function getTransitions(state: StateDefinition): string[] {
  const targets: string[] = [];
  if (!state || typeof state !== "object") return targets;
  if (typeof state.Next === "string") targets.push(state.Next);
  if (Array.isArray(state.Choices)) {
    for (const choice of state.Choices) {
      if (choice && typeof choice.Next === "string") targets.push(choice.Next);
    }
  }
  if (typeof state.Default === "string") targets.push(state.Default);
  if (Array.isArray(state.Catch)) {
    for (const catcher of state.Catch) {
      if (catcher && typeof catcher.Next === "string")
        targets.push(catcher.Next);
    }
  }
  return targets;
}
