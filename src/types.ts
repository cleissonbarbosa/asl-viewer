export interface ASLDefinition {
  Comment?: string;
  StartAt: string;
  States: Record<string, StateDefinition>;
  TimeoutSeconds?: number;
  Version?: string;
}

export interface StateDefinition {
  Type: StateType;
  Comment?: string;
  Next?: string;
  End?: boolean;
  InputPath?: string;
  OutputPath?: string;
  ResultPath?: string;
  Parameters?: Record<string, any>;
  ResultSelector?: Record<string, any>;
  Retry?: RetryDefinition[];
  Catch?: CatchDefinition[];
  TimeoutSeconds?: number;
  HeartbeatSeconds?: number;
  // Task-specific
  Resource?: string;
  // Choice-specific
  Choices?: ChoiceRule[];
  Default?: string;
  // Wait-specific
  Seconds?: number;
  Timestamp?: string;
  SecondsPath?: string;
  TimestampPath?: string;
  // Parallel-specific
  Branches?: ASLDefinition[];
  // Map-specific
  Iterator?: ASLDefinition;
  ItemsPath?: string;
  MaxConcurrency?: number;
  // Pass-specific
  Result?: any;
  // Fail-specific
  Cause?: string;
  Error?: string;
}

export type StateType = 
  | 'Pass'
  | 'Task'
  | 'Choice'
  | 'Wait'
  | 'Succeed'
  | 'Fail'
  | 'Parallel'
  | 'Map';

export interface ChoiceRule {
  Variable?: string;
  StringEquals?: string;
  StringLessThan?: string;
  StringGreaterThan?: string;
  StringLessThanEquals?: string;
  StringGreaterThanEquals?: string;
  NumericEquals?: number;
  NumericLessThan?: number;
  NumericGreaterThan?: number;
  NumericLessThanEquals?: number;
  NumericGreaterThanEquals?: number;
  BooleanEquals?: boolean;
  TimestampEquals?: string;
  TimestampLessThan?: string;
  TimestampGreaterThan?: string;
  TimestampLessThanEquals?: string;
  TimestampGreaterThanEquals?: string;
  And?: ChoiceRule[];
  Or?: ChoiceRule[];
  Not?: ChoiceRule;
  Next: string;
}

export interface RetryDefinition {
  ErrorEquals: string[];
  IntervalSeconds?: number;
  MaxAttempts?: number;
  BackoffRate?: number;
}

export interface CatchDefinition {
  ErrorEquals: string[];
  Next: string;
  ResultPath?: string;
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
}

export interface Connection {
  from: string;
  to: string;
  type: ConnectionType;
  label?: string;
  condition?: string;
}

export type ConnectionType = 
  | 'next'
  | 'choice'
  | 'error'
  | 'retry'
  | 'default';

export interface ValidationError {
  message: string;
  path: string;
  severity: 'error' | 'warning';
  line?: number;
  column?: number;
}

export interface WorkflowViewerProps {
  definition: ASLDefinition | string;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  readonly?: boolean;
  onStateClick?: (state: StateNode) => void;
  onValidationError?: (error: ValidationError) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface GraphLayout {
  nodes: StateNode[];
  edges: Connection[];
  width: number;
  height: number;
}

export interface ViewerTheme {
  background: string;
  nodeColors: {
    pass: string;
    task: string;
    choice: string;
    wait: string;
    succeed: string;
    fail: string;
    parallel: string;
    map: string;
  };
  textColor: string;
  borderColor: string;
  connectionColor: string;
  errorColor: string;
  successColor: string;
}
