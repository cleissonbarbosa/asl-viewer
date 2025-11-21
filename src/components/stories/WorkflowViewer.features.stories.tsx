import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkflowViewer } from "../WorkflowViewer";
import {
  complexWorkflowDefinition,
  ecommerceWorkflowDefinition,
  dataProcessingWorkflowDefinition,
  helloWorldDefinition,
  simpleWorkflow,
} from "./workflow-definitions";
import { WorkflowViewerProps } from "../../types";

const meta: Meta<typeof WorkflowViewer> = {
  title: "Components/WorkflowViewer/Features",
  component: WorkflowViewer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Showcase of specific features and capabilities of the WorkflowViewer component.",
      },
    },
  },
  tags: ["autodocs", "features"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * MiniMap feature for easy navigation
 */
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
  parameters: {
    docs: {
      description: {
        story:
          "Workflow with MiniMap enabled for easy navigation in large diagrams",
      },
    },
  },
};

/**
 * Draggable nodes functionality
 */
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
    useControls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive workflow where nodes can be dragged around to reorganize the layout",
      },
    },
  },
};

/**
 * Multi-select functionality
 */
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
  } as WorkflowViewerProps,
  parameters: {
    docs: {
      description: {
        story:
          "Workflow with multi-select capability - hold Ctrl/Cmd to select multiple nodes",
      },
    },
  },
};

/**
 * MiniMap navigation focus
 */
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
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates MiniMap navigation capabilities with zoom and fit-to-view",
      },
    },
  },
};

/**
 * Fully interactive workflow
 */
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
  } as WorkflowViewerProps,

  parameters: {
    docs: {
      description: {
        story:
          "All interactive features enabled - dragging, selecting, connecting, zooming, and more",
      },
    },
  },

  globals: {
    backgrounds: {
      value: "dark",
    },
  },
};

/**
 * Keyboard navigation focus
 */
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
  parameters: {
    docs: {
      description: {
        story:
          "Minimal interaction - only keyboard navigation and selection enabled",
      },
    },
  },
};

/**
 * Full controls showcase
 */
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
  } as WorkflowViewerProps,
  parameters: {
    docs: {
      description: {
        story: "Showcases all available controls and interaction features",
      },
    },
  },
};

/**
 * Minimal embedded view
 */
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
  parameters: {
    docs: {
      description: {
        story:
          "Minimal view perfect for embedding in dashboards or documentation",
      },
    },
  },
};

/**
 * Draggable workflow demonstration
 */
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
  } as WorkflowViewerProps,
  parameters: {
    docs: {
      description: {
        story:
          "Interactive workflow where nodes can be repositioned by dragging",
      },
    },
  },
};

/**
 * Custom styling example
 */
export const CustomStyling: Story = {
  args: {
    definition: simpleWorkflow,
    height: 600,
    theme: "dark",
  },
};

/**
 * Horizontal layout demonstration
 */
export const HorizontalLayout: Story = {
  args: {
    definition: simpleWorkflow,
    height: 600,
    layoutDirection: "LR",
    showToolbar: true,
  },
};

/**
 * Toolbar features showcase
 */
export const WithToolbar: Story = {
  args: {
    definition: simpleWorkflow,
    height: 600,
    showToolbar: true,
    showControls: true,
    showMiniMap: true,
  },
};
