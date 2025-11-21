import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { WorkflowViewer } from "../WorkflowViewer";
import { getThemeNames } from "../../core/theme";
import {
  helloWorldDefinition,
  complexWorkflowDefinition,
  invalidWorkflowDefinition,
} from "./workflow-definitions";
import { WorkflowViewerProps } from "../../types";

const meta: Meta<WorkflowViewerProps> = {
  title: "Components/WorkflowViewer/Basic",
  component: WorkflowViewer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "WorkflowViewer is a React component for visualizing AWS Step Functions state machines using React Flow.",
      },
    },
  },
  tags: ["autodocs", "basic"],
  argTypes: {
    theme: {
      control: { type: "select" },
      options: getThemeNames(),
      description: "Visual theme for the workflow viewer",
    },
    width: {
      control: { type: "number", min: 400, max: 1200, step: 50 },
      description: "Width of the viewer in pixels",
    },
    height: {
      control: { type: "number", min: 300, max: 800, step: 50 },
      description: "Height of the viewer in pixels",
    },
    readonly: {
      control: { type: "boolean" },
      description: "Whether the workflow is read-only or interactive",
    },
    isConnectable: {
      control: { type: "boolean" },
      description: "Whether nodes can be connected",
    },
    isDraggable: {
      control: { type: "boolean" },
      description: "Whether nodes can be dragged",
    },
    isSelectable: {
      control: { type: "boolean" },
      description: "Whether nodes can be selected",
    },
    isMultiSelect: {
      control: { type: "boolean" },
      description: "Whether multiple nodes can be selected",
    },
    useMiniMap: {
      control: { type: "boolean" },
      description: "Show mini-map for navigation",
    },
    useControls: {
      control: { type: "boolean" },
      description: "Show zoom and pan controls",
    },
    useZoom: {
      control: { type: "boolean" },
      description: "Enable zoom functionality",
    },
    useFitView: {
      control: { type: "boolean" },
      description: "Automatically fit the view to content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Simple Hello World workflow - the most basic example
 */
export const HelloWorld: Story = {
  args: {
    definition: helloWorldDefinition,
    width: 400,
    height: 300,
    theme: "light",
    readonly: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "A minimal workflow with a single Pass state that outputs 'Hello World!'",
      },
    },
  },
};

/**
 * Complex workflow demonstrating multiple state types
 */
export const ComplexWorkflow: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "light",
    readonly: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "A more complex workflow showing Task, Choice, Parallel, Wait, Succeed, and Fail states",
      },
    },
  },
};

/**
 * Workflow with validation errors for testing error handling
 */
export const WithErrors: Story = {
  args: {
    definition: invalidWorkflowDefinition,
    width: 600,
    height: 400,
    theme: "light",
    readonly: true,
    onValidationError: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "A workflow with intentional validation errors to demonstrate error display",
      },
    },
  },
};

/**
 * Interactive workflow with event handlers
 */
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
  } as WorkflowViewerProps,
  parameters: {
    docs: {
      description: {
        story:
          "An interactive workflow where nodes can be clicked and manipulated",
      },
    },
  },
};

/**
 * Minimal view with no controls or extra features
 */
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
  parameters: {
    docs: {
      description: {
        story: "A minimal view with all controls and interactions disabled",
      },
    },
  },
};

/**
 * Read-only presentation mode for embedding
 */
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
  parameters: {
    docs: {
      description: {
        story:
          "Perfect for presentations or documentation where no interaction is needed",
      },
    },
  },
};
