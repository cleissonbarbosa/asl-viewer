/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Query language used by a state machine or an individual state.
 * JSONata support was introduced to Step Functions in late 2024.
 */
export type QueryLanguage = "JSONPath" | "JSONata";

export interface ASLDefinition {
  Comment?: string;
  StartAt: string;
  States: Record<string, StateDefinition>;
  TimeoutSeconds?: number;
  Version?: string;
  QueryLanguage?: QueryLanguage;
}

/**
 * Definition of the workflow executed for every item of a Map state.
 * `ItemProcessor` is the current form; `Iterator` is the legacy form.
 */
export interface ItemProcessorDefinition extends ASLDefinition {
  ProcessorConfig?: {
    Mode?: "INLINE" | "DISTRIBUTED";
    ExecutionType?: "STANDARD" | "EXPRESS";
  };
}

export interface StateDefinition {
  Type: StateType;
  Comment?: string;
  QueryLanguage?: QueryLanguage;
  Next?: string;
  End?: boolean;
  // JSONPath data flow
  InputPath?: string | null;
  OutputPath?: string | null;
  ResultPath?: string | null;
  Parameters?: Record<string, any>;
  ResultSelector?: Record<string, any>;
  // JSONata data flow
  Arguments?: any;
  Output?: any;
  Assign?: Record<string, any>;
  // Error handling
  Retry?: RetryDefinition[];
  Catch?: CatchDefinition[];
  TimeoutSeconds?: number | string;
  TimeoutSecondsPath?: string;
  HeartbeatSeconds?: number | string;
  HeartbeatSecondsPath?: string;
  // Task-specific
  Resource?: string;
  Credentials?: Record<string, any>;
  // Choice-specific
  Choices?: ChoiceRule[];
  Default?: string;
  // Wait-specific
  Seconds?: number | string;
  Timestamp?: string;
  SecondsPath?: string;
  TimestampPath?: string;
  // Parallel-specific
  Branches?: ASLDefinition[];
  // Map-specific
  ItemProcessor?: ItemProcessorDefinition;
  /** @deprecated Use `ItemProcessor`. Still supported by Step Functions. */
  Iterator?: ASLDefinition;
  ItemsPath?: string;
  Items?: any;
  ItemSelector?: Record<string, any>;
  ItemReader?: Record<string, any>;
  ItemBatcher?: Record<string, any>;
  ResultWriter?: Record<string, any>;
  MaxConcurrency?: number | string;
  MaxConcurrencyPath?: string;
  ToleratedFailurePercentage?: number | string;
  ToleratedFailurePercentagePath?: string;
  ToleratedFailureCount?: number | string;
  ToleratedFailureCountPath?: string;
  Label?: string;
  // Pass-specific
  Result?: any;
  // Fail-specific
  Cause?: string;
  CausePath?: string;
  Error?: string;
  ErrorPath?: string;
}

export type StateType =
  | "Pass"
  | "Task"
  | "Choice"
  | "Wait"
  | "Succeed"
  | "Fail"
  | "Parallel"
  | "Map";

/**
 * A boolean expression used inside a Choice rule. Nested expressions
 * (inside `And`, `Or` and `Not`) do not have a `Next` field.
 */
export interface ChoiceExpression {
  Variable?: string;
  /** JSONata condition, e.g. `{% $states.input.total > 100 %}` */
  Condition?: string;
  StringEquals?: string;
  StringEqualsPath?: string;
  StringLessThan?: string;
  StringLessThanPath?: string;
  StringGreaterThan?: string;
  StringGreaterThanPath?: string;
  StringLessThanEquals?: string;
  StringLessThanEqualsPath?: string;
  StringGreaterThanEquals?: string;
  StringGreaterThanEqualsPath?: string;
  StringMatches?: string;
  NumericEquals?: number;
  NumericEqualsPath?: string;
  NumericLessThan?: number;
  NumericLessThanPath?: string;
  NumericGreaterThan?: number;
  NumericGreaterThanPath?: string;
  NumericLessThanEquals?: number;
  NumericLessThanEqualsPath?: string;
  NumericGreaterThanEquals?: number;
  NumericGreaterThanEqualsPath?: string;
  BooleanEquals?: boolean;
  BooleanEqualsPath?: string;
  TimestampEquals?: string;
  TimestampEqualsPath?: string;
  TimestampLessThan?: string;
  TimestampLessThanPath?: string;
  TimestampGreaterThan?: string;
  TimestampGreaterThanPath?: string;
  TimestampLessThanEquals?: string;
  TimestampLessThanEqualsPath?: string;
  TimestampGreaterThanEquals?: string;
  TimestampGreaterThanEqualsPath?: string;
  IsNull?: boolean;
  IsPresent?: boolean;
  IsNumeric?: boolean;
  IsString?: boolean;
  IsBoolean?: boolean;
  IsTimestamp?: boolean;
  And?: ChoiceExpression[];
  Or?: ChoiceExpression[];
  Not?: ChoiceExpression;
  Next?: string;
}

export interface ChoiceRule extends ChoiceExpression {
  Next: string;
  Comment?: string;
  Assign?: Record<string, any>;
  Output?: any;
}

export interface RetryDefinition {
  ErrorEquals: string[];
  IntervalSeconds?: number;
  MaxAttempts?: number;
  BackoffRate?: number;
  MaxDelaySeconds?: number;
  JitterStrategy?: "FULL" | "NONE";
  Comment?: string;
}

export interface CatchDefinition {
  ErrorEquals: string[];
  Next: string;
  ResultPath?: string | null;
  Output?: any;
  Assign?: Record<string, any>;
  Comment?: string;
}

export interface StateNode {
  id: string;
  name: string;
  type: StateType;
  definition: StateDefinition;
  position: { x: number; y: number };
  size: { width: number; height: number };
  connections: Connection[];
  isStartState: boolean;
  isEndState: boolean;
  parentId?: string; // For child nodes in Parallel/Map states
  branchIndex?: number; // For Parallel branches or Map iterator
  children?: StateNode[]; // For Parallel/Map parent nodes
  isGroup?: boolean; // For group nodes that contain parent + children
  groupBounds?: { width: number; height: number }; // Size of the group container
  isExpanded?: boolean; // For controlling visibility of child nodes
}

export interface Connection {
  from: string;
  to: string;
  type: ConnectionType;
  label?: string;
  condition?: string;
  /**
   * Bend points computed by the layout engine (absolute coordinates,
   * excluding the source and target handles). Used to draw orthogonal
   * edges that route around nodes.
   */
  points?: { x: number; y: number }[];
}

export type ConnectionType = "next" | "choice" | "error" | "retry" | "default";

export interface ValidationError {
  message: string;
  path: string;
  severity: "error" | "warning";
  line?: number;
  column?: number;
}

export interface WorkflowViewerProps {
  definition?: ASLDefinition | string;
  url?: string;
  file?: File;
  /** Width in pixels or any CSS length (e.g. `"100%"`). Defaults to `800`. */
  width?: number | string;
  /** Height in pixels or any CSS length (e.g. `"100%"`). Defaults to `600`. */
  height?: number | string;
  theme?: ThemeName | ViewerTheme;
  hideComment?: boolean;
  useMiniMap?: boolean;
  useControls?: boolean;
  useZoom?: boolean;
  useFitView?: boolean;
  isDraggable?: boolean;
  isSelectable?: boolean;
  isConnectable?: boolean;
  isMultiSelect?: boolean;
  readonly?: boolean;
  layoutDirection?: "TB" | "LR";
  showToolbar?: boolean;
  /** Show the built-in state details panel when a state is clicked. Defaults to `true`. */
  showDetailPanel?: boolean;
  onStateClick?: (state: StateNode) => void;
  onValidationError?: (error: ValidationError) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onLoadError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface GraphLayout {
  nodes: StateNode[];
  edges: Connection[];
  width: number;
  height: number;
}

/**
 * Available theme names
 */
export type ThemeName = "light" | "dark" | "highContrast" | "soft";

export interface ViewerTheme {
  name: ThemeName | string;
  background: string;
  surfaceColor: string;
  overlayColor: string;
  nodeColors: {
    pass: string;
    task: string;
    stepFunction: string;
    choice: string;
    wait: string;
    succeed: string;
    fail: string;
    parallel: string;
    map: string;
  };
  nodeBorderColors: {
    pass: string;
    task: string;
    stepFunction: string;
    choice: string;
    wait: string;
    succeed: string;
    fail: string;
    parallel: string;
    map: string;
  };
  nodeHoverColors: {
    pass: string;
    task: string;
    stepFunction: string;
    choice: string;
    wait: string;
    succeed: string;
    fail: string;
    parallel: string;
    map: string;
  };
  textColor: string;
  textColorSecondary: string;
  textColorMuted: string;
  borderColor: string;
  borderColorHover: string;
  connectionColor: string;
  connectionHoverColor: string;
  connectionLabelColor: string;
  startNodeColor: string;
  endNodeColor: string;
  selectedNodeColor: string;
  shadowColor: string;
  errorColor: string;
  warningColor: string;
  infoColor: string;
  successColor: string;
  gridColor: string;
  miniMapBackground: string;
  controlsBackground: string;
  tooltipBackground: string;
  tooltipTextColor: string;
  /** Optional font stack. Defaults to the system UI font stack. */
  fontFamily?: string;
}
