import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowViewer } from "./WorkflowViewer";
import { getThemeNames } from "../core/theme";
import {
  helloWorldDefinition,
  complexWorkflowDefinition,
} from "./stories/workflow-definitions";
import { WorkflowViewerProps } from "../types";

const meta: Meta<WorkflowViewerProps> = {
  title: "Components/WorkflowViewer",
  component: WorkflowViewer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `

A React component for visualizing AWS Step Functions state machines using React Flow.

## Features

- 🎨 **Multiple Themes**: Light, dark, high contrast, and soft themes
- 🖱️ **Interactive**: Draggable nodes, multi-select, zoom controls
- 🗺️ **MiniMap**: Navigation aid for large workflows
- 📁 **File Support**: Load from JSON/YAML files or URLs
- 🔧 **Customizable**: Extensive props for customization
- ♿ **Accessible**: Keyboard navigation and high contrast support

## Organized Stories

The stories are organized into categories:

- **Basic**: Core functionality and simple examples
- **Themes**: Different visual themes and custom theme creation
- **Examples**: Real-world workflow examples (e-commerce, data processing)
- **Features**: Specific feature demonstrations (MiniMap, dragging, etc.)
- **Loading**: URL and file loading capabilities
        `,
      },
    },
  },
  tags: ["autodocs", "!dev"],
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
    useMiniMap: true,
    useControls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "A more complex workflow showing Task, Choice, Parallel, Wait, Succeed, and Fail states with MiniMap and controls",
      },
    },
  },
};
