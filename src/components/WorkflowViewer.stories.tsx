import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { WorkflowViewer } from "../components/WorkflowViewer";
import { FileUploader, URLInput } from "../components/FileUploader";
import { ASLDefinition } from "../types";
import { getTheme } from "../utils/theme";
import React from "react";

const meta: Meta<typeof WorkflowViewer> = {
  title: "WorkflowViewer",
  component: WorkflowViewer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    theme: {
      control: { type: "select" },
      options: ["light", "dark"],
    },
    width: {
      control: { type: "number", min: 400, max: 1200, step: 50 },
    },
    height: {
      control: { type: "number", min: 300, max: 800, step: 50 },
    },
    readonly: {
      control: { type: "boolean" },
    },
    isConnectable: {
      control: { type: "boolean" },
    },
    isDraggable: {
      control: { type: "boolean" },
    },
    isSelectable: {
      control: { type: "boolean" },
    },
    isMultiSelect: {
      control: { type: "boolean" },
    },
    useMiniMap: {
      control: { type: "boolean" },
    },
    useControls: {
      control: { type: "boolean" },
    },
    useZoom: {
      control: { type: "boolean" },
    },
    useFitView: {
      control: { type: "boolean" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Simple Hello World workflow
const helloWorldDefinition: ASLDefinition = {
  Comment: "A Hello World example",
  StartAt: "HelloWorld",
  States: {
    HelloWorld: {
      Type: "Pass",
      Result: "Hello World!",
      End: true,
    },
  },
};

// More complex workflow with choices and parallel execution
const complexWorkflowDefinition: ASLDefinition = {
  Comment: "Complex workflow demonstrating various state types",
  StartAt: "ValidateInput",
  States: {
    ValidateInput: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:ValidateInput",
      Next: "CheckValidation",
    },
    CheckValidation: {
      Type: "Choice",
      Choices: [
        {
          Variable: "$.isValid",
          BooleanEquals: true,
          Next: "ProcessInParallel",
        },
        {
          Variable: "$.isValid",
          BooleanEquals: false,
          Next: "HandleError",
        },
      ],
      Default: "HandleError",
    },
    ProcessInParallel: {
      Type: "Parallel",
      Branches: [
        {
          StartAt: "ProcessDataA",
          States: {
            ProcessDataA: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:ProcessDataA",
              End: true,
            },
          },
        },
        {
          StartAt: "ProcessDataB",
          States: {
            ProcessDataB: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:ProcessDataB",
              End: true,
            },
          },
        },
      ],
      Next: "WaitForProcessing",
    },
    WaitForProcessing: {
      Type: "Wait",
      Seconds: 5,
      Next: "FinalizeProcessing",
    },
    FinalizeProcessing: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:FinalizeProcessing",
      Next: "Success",
    },
    HandleError: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:HandleError",
      Next: "Failure",
    },
    Success: {
      Type: "Succeed",
    },
    Failure: {
      Type: "Fail",
      Cause: "Validation failed or processing error",
    },
  },
};

// Workflow with errors for testing error display
const invalidWorkflowDefinition: ASLDefinition = {
  Comment: "Invalid workflow for testing error handling",
  StartAt: "NonExistentState",
  States: {
    TaskWithoutResource: {
      Type: "Task",
      Next: "AnotherNonExistentState",
    },
    ChoiceWithoutChoices: {
      Type: "Choice",
      End: true,
    },
  },
};

// E-commerce order processing workflow
const ecommerceWorkflowDefinition: ASLDefinition = {
  Comment: "E-commerce order processing workflow",
  StartAt: "ReceiveOrder",
  States: {
    ReceiveOrder: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:ReceiveOrder",
      Next: "ValidateOrder",
    },
    ValidateOrder: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:ValidateOrder",
      Retry: [
        {
          ErrorEquals: ["States.TaskFailed"],
          IntervalSeconds: 2,
          MaxAttempts: 3,
          BackoffRate: 2.0,
        },
      ],
      Catch: [
        {
          ErrorEquals: ["States.ALL"],
          Next: "OrderValidationFailed",
        },
      ],
      Next: "CheckInventory",
    },
    CheckInventory: {
      Type: "Parallel",
      Branches: [
        {
          StartAt: "CheckProductInventory",
          States: {
            CheckProductInventory: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:CheckInventory",
              End: true,
            },
          },
        },
        {
          StartAt: "ReserveInventory",
          States: {
            ReserveInventory: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:ReserveInventory",
              End: true,
            },
          },
        },
      ],
      Next: "ProcessPayment",
    },
    ProcessPayment: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:ProcessPayment",
      Next: "PaymentResult",
    },
    PaymentResult: {
      Type: "Choice",
      Choices: [
        {
          Variable: "$.paymentStatus",
          StringEquals: "SUCCESS",
          Next: "FulfillOrder",
        },
        {
          Variable: "$.paymentStatus",
          StringEquals: "FAILED",
          Next: "PaymentFailed",
        },
      ],
      Default: "PaymentFailed",
    },
    FulfillOrder: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:FulfillOrder",
      Next: "SendConfirmation",
    },
    SendConfirmation: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:SendConfirmation",
      Next: "OrderCompleted",
    },
    OrderCompleted: {
      Type: "Succeed",
    },
    PaymentFailed: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:HandlePaymentFailure",
      Next: "OrderFailed",
    },
    OrderValidationFailed: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:HandleValidationFailure",
      Next: "OrderFailed",
    },
    OrderFailed: {
      Type: "Fail",
      Cause: "Order processing failed",
    },
  },
};

// Data processing pipeline
const dataProcessingWorkflowDefinition: ASLDefinition = {
  Comment: "Data processing pipeline with Map state",
  StartAt: "PrepareData",
  States: {
    PrepareData: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:PrepareData",
      Next: "ProcessBatches",
    },
    ProcessBatches: {
      Type: "Map",
      ItemsPath: "$.batches",
      MaxConcurrency: 5,
      Iterator: {
        StartAt: "ProcessBatch",
        States: {
          ProcessBatch: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:ProcessBatch",
            Next: "ValidateBatch",
          },
          ValidateBatch: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:ValidateBatch",
            Next: "BatchProcessed",
          },
          BatchProcessed: {
            Type: "Succeed",
          },
        },
      },
      Next: "AggregateResults",
    },
    AggregateResults: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:AggregateResults",
      Next: "GenerateReport",
    },
    GenerateReport: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:GenerateReport",
      Next: "WaitForReview",
    },
    WaitForReview: {
      Type: "Wait",
      Seconds: 300,
      Next: "SendReport",
    },
    SendReport: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:SendReport",
      Next: "ProcessingComplete",
    },
    ProcessingComplete: {
      Type: "Succeed",
    },
  },
};

export const HelloWorld: Story = {
  args: {
    definition: helloWorldDefinition,
    width: 400,
    height: 300,
    theme: "light",
    readonly: true,
  },
};

export const ComplexWorkflow: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: true,
  },
};

export const DarkTheme: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "dark",
    readonly: true,
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export const WithErrors: Story = {
  args: {
    definition: invalidWorkflowDefinition,
    width: 600,
    height: 400,
    theme: "light",
    readonly: true,
    onValidationError: fn(),
  },
};

export const Interactive: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: false,
    isDraggable: true,
    isMultiSelect: true,
    onStateClick: (state) => {
      console.log("State clicked:", state);
    },
    onValidationError: (error) => {
      console.log("Validation error:", error);
    },
  },
};

// New stories showcasing the new props
export const WithMiniMap: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    useMiniMap: true,
    useControls: true,
    readonly: true,
  },
};

export const DraggableNodes: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    isDraggable: true,
    isSelectable: true,
    isMultiSelect: true,
    readonly: false,
  },
};

export const MinimalView: Story = {
  args: {
    definition: helloWorldDefinition,
    width: 400,
    height: 600,
    theme: "light",
    useControls: false,
    useMiniMap: false,
    useZoom: false,
    useFitView: false,
    isSelectable: false,
    readonly: true,
  },
};

export const FullyInteractive: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 900,
    height: 700,
    theme: "dark",
    useMiniMap: true,
    useControls: true,
    useZoom: true,
    useFitView: true,
    isDraggable: true,
    isSelectable: true,
    isMultiSelect: true,
    isConnectable: true,
    readonly: false,
    onStateClick: (state) => {
      console.log("State clicked:", state);
    },
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export const ReadOnlyPresentationMode: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: true,
    useControls: false,
    useMiniMap: false,
    isDraggable: false,
    isSelectable: false,
    isConnectable: false,
    useZoom: false,
  },
};

// URL Loading Story
export const LoadFromURL: Story = {
  render: (args) => {
    const [currentUrl, setCurrentUrl] = React.useState<string>(
      "https://raw.githubusercontent.com/aws-samples/aws-stepfunctions-examples/refs/heads/main/sam/demo-asl-features/template.yaml"
    );

    return (
      <div
        style={{ width: args.width || 800, height: (args.height || 600) + 100 }}
      >
        <div style={{ marginBottom: "16px" }}>
          <URLInput
            onUrlSubmit={setCurrentUrl}
            theme={getTheme("light")}
            defaultValue="https://raw.githubusercontent.com/aws-samples/aws-stepfunctions-examples/refs/heads/main/sam/demo-asl-features/template.yaml"
            placeholder="Try: https://raw.githubusercontent.com/aws/aws-toolkit-vscode/main/examples/simple-workflow.json"
          />
        </div>
        <WorkflowViewer
          {...args}
          url={currentUrl}
          onLoadStart={() => console.log("Loading started")}
          onLoadEnd={() => console.log("Loading finished")}
          onLoadError={(error) => console.error("Loading error:", error)}
        />
      </div>
    );
  },
  args: {
    width: 800,
    height: 500,
    theme: "light",
    readonly: true,
  },
};

// File Upload Story
export const LoadFromFile: Story = {
  render: (args) => {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

    return (
      <div
        style={{ width: args.width || 800, height: (args.height || 600) + 200 }}
      >
        <div style={{ marginBottom: "16px" }}>
          <FileUploader
            onFileSelect={setSelectedFile}
            theme={getTheme("light")}
            style={{ marginBottom: "8px" }}
          />
          {selectedFile && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
        <WorkflowViewer
          {...args}
          file={selectedFile || undefined}
          onLoadStart={() => console.log("Loading started")}
          onLoadEnd={() => console.log("Loading finished")}
          onLoadError={(error) => console.error("Loading error:", error)}
        />
      </div>
    );
  },
  args: {
    width: 800,
    height: 400,
    theme: "light",
    readonly: true,
  },
};

// YAML Support Story
export const YAMLSupport: Story = {
  args: {
    definition: `# YAML ASL Definition
Comment: "A Hello World example in YAML"
StartAt: "HelloWorld"
States:
  HelloWorld:
    Type: "Pass"
    Result: "Hello World from YAML!"
    End: true`,
    width: 400,
    height: 300,
    theme: "light",
    readonly: true,
  },
};

// New complex workflow stories
export const ECommerceWorkflow: Story = {
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 900,
    height: 700,
    theme: "light",
    readonly: true,
    useMiniMap: true,
    useControls: true,
    onStateClick: (state) => {
      console.log("E-commerce state clicked:", state);
    },
  },
};

export const DataProcessingPipeline: Story = {
  args: {
    definition: dataProcessingWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "dark",
    readonly: true,
    useMiniMap: true,
    useControls: true,
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

// Feature-specific stories
export const InteractiveMultiSelect: Story = {
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 900,
    height: 700,
    theme: "light",
    readonly: false,
    isDraggable: true,
    isSelectable: true,
    isMultiSelect: true,
    useMiniMap: true,
    useControls: true,
    onStateClick: (state) => {
      console.log("Multi-select state clicked:", state);
    },
  },
};

export const MiniMapNavigation: Story = {
  args: {
    definition: dataProcessingWorkflowDefinition,
    width: 700,
    height: 500,
    theme: "light",
    readonly: true,
    useMiniMap: true,
    useControls: true,
    useFitView: true,
    useZoom: true,
  },
};

export const DraggableWorkflow: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: false,
    isDraggable: true,
    isSelectable: true,
    useControls: true,
    onStateClick: (state) => {
      console.log("Draggable node clicked:", state);
    },
  },
};

export const MinimalEmbedded: Story = {
  args: {
    definition: helloWorldDefinition,
    width: 300,
    height: 200,
    theme: "light",
    readonly: true,
    useControls: false,
    useMiniMap: false,
    useZoom: false,
    useFitView: true,
    isSelectable: false,
    isDraggable: false,
  },
};

export const LargeWorkflowWithMiniMap: Story = {
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 1000,
    height: 800,
    theme: "dark",
    readonly: true,
    useMiniMap: true,
    useControls: true,
    useZoom: true,
    useFitView: true,
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

// Comparison stories
export const ComparisonWithoutMiniMap: Story = {
  name: "Complex Workflow - No MiniMap",
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: true,
    useMiniMap: false,
    useControls: true,
  },
};

export const ComparisonWithMiniMap: Story = {
  name: "Complex Workflow - With MiniMap",
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: true,
    useMiniMap: true,
    useControls: true,
  },
};

// Accessibility and control stories
export const KeyboardNavigationOnly: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: true,
    useControls: false,
    useMiniMap: false,
    isDraggable: false,
    isSelectable: true,
    useZoom: false,
  },
};

export const FullControlsEnabled: Story = {
  args: {
    definition: dataProcessingWorkflowDefinition,
    width: 900,
    height: 700,
    theme: "light",
    readonly: false,
    useControls: true,
    useMiniMap: true,
    useZoom: true,
    useFitView: true,
    isDraggable: true,
    isSelectable: true,
    isMultiSelect: true,
    isConnectable: true,
    onStateClick: (state) => {
      console.log("Full controls - state clicked:", state);
    },
    onValidationError: (error) => {
      console.log("Validation error:", error);
    },
  },
};
