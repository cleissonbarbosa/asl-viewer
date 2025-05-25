import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowViewer } from "../components/WorkflowViewer";
import { ASLDefinition } from "../types";

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
