import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowViewer } from "../components/WorkflowViewer";
import { FileUploader, URLInput } from "../components/FileUploader";
import { ASLDefinition } from "../types";
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
  },
};

export const Interactive: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: false,
    onStateClick: (state) => {
      console.log("State clicked:", state);
    },
    onValidationError: (error) => {
      console.log("Validation error:", error);
    },
  },
};

// URL Loading Story
export const LoadFromURL: Story = {
  render: (args) => {
    const [currentUrl, setCurrentUrl] = React.useState<string>("");

    return (
      <div
        style={{ width: args.width || 800, height: (args.height || 600) + 100 }}
      >
        <div style={{ marginBottom: "16px" }}>
          <URLInput
            onUrlSubmit={setCurrentUrl}
            theme={{
              background: "white",
              borderColor: "#ddd",
              textColor: "#333",
              infoColor: "#007acc",
            }}
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
            theme={{
              background: "white",
              borderColor: "#ddd",
              textColor: "#333",
              infoColor: "#007acc",
            }}
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
