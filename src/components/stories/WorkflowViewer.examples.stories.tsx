import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkflowViewer } from "../WorkflowViewer";
import {
  ecommerceWorkflowDefinition,
  dataProcessingWorkflowDefinition,
  yamlDefinition,
} from "./workflow-definitions";
import { WorkflowViewerProps } from "../../types";

const meta: Meta<typeof WorkflowViewer> = {
  title: "Components/WorkflowViewer/Examples",
  component: WorkflowViewer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Real-world workflow examples demonstrating various use cases and patterns.",
      },
    },
  },
  tags: ["autodocs", "examples"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * E-commerce order processing workflow
 */
export const ECommerceWorkflow: Story = {
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 900,
    height: 700,
    theme: "light",
    readonly: true,
    showToolbar: false,
    useMiniMap: true,
    useControls: true,
    onStateClick: (state) => {
      console.log("E-commerce state clicked:", state);
    },
  } as WorkflowViewerProps,
  parameters: {
    docs: {
      description: {
        story:
          "Complete e-commerce order processing workflow with validation, inventory check, payment processing, and error handling",
      },
    },
  },
};

/**
 * Data processing pipeline with Map state
 */
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
    docs: {
      description: {
        story:
          "Data processing pipeline demonstrating Map state for parallel batch processing",
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
 * YAML format support demonstration
 */
export const YAMLSupport: Story = {
  args: {
    definition: yamlDefinition,
    width: 400,
    height: 300,
    theme: "light",
    readonly: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates support for YAML format ASL definitions",
      },
    },
  },
};

/**
 * Large workflow with MiniMap for navigation
 */
export const LargeWorkflowWithMiniMap: Story = {
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 1000,
    height: 800,
    theme: "dark",
    readonly: true,
    useMiniMap: true,
    useControls: true,
    showToolbar: false,
    useZoom: true,
    useFitView: true,
  },

  parameters: {
    docs: {
      description: {
        story:
          "Large workflow showing how MiniMap helps with navigation in complex diagrams",
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
 * Comparison: Complex workflow without MiniMap
 */
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
  parameters: {
    docs: {
      description: {
        story: "Same complex workflow without MiniMap for comparison",
      },
    },
  },
};

/**
 * Comparison: Complex workflow with MiniMap
 */
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
  parameters: {
    docs: {
      description: {
        story: "Same complex workflow with MiniMap showing navigation benefits",
      },
    },
  },
};

/**
 * Data processing pipeline in Horizontal Layout
 */
export const DataProcessingHorizontal: Story = {
  args: {
    definition: dataProcessingWorkflowDefinition,
    width: 900,
    height: 600,
    layoutDirection: "LR",
    showToolbar: true,
    showControls: true,
    showMiniMap: true,
  } as WorkflowViewerProps,
  parameters: {
    docs: {
      description: {
        story:
          "Data processing pipeline displayed in a horizontal (Left-to-Right) layout",
      },
    },
  },
};
