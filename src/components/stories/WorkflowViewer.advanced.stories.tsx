import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkflowViewer } from "../WorkflowViewer";
import {
  complexWorkflowDefinition,
  ecommerceWorkflowDefinition,
  dataProcessingWorkflowDefinition,
  cyclicWorkflowDefinition,
  errorHandlingWorkflowDefinition,
} from "./workflow-definitions";
import { WorkflowViewerProps } from "../../types";

const meta: Meta<WorkflowViewerProps> = {
  title: "Components/WorkflowViewer/Advanced Features",
  component: WorkflowViewer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Advanced features including statistics panel, export, enhanced search, and cycle detection.",
      },
    },
  },
  tags: ["autodocs", "advanced"],
  argTypes: {
    theme: {
      control: { type: "select" },
      options: ["light", "dark", "highContrast", "soft"],
      description: "Visual theme for the workflow viewer",
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowViewer>;

/**
 * ## Statistics Panel
 *
 * The toolbar now includes a **Statistics** button (bar chart icon) that opens
 * a panel showing workflow analytics:
 * - Total states, connections, max depth
 * - State type breakdown with visual bars
 * - Error handling coverage
 * - Cycle detection
 * - Complexity score (1-10)
 *
 * Click the bar chart icon in the toolbar to see it in action.
 */
export const StatisticsPanel: Story = {
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 1200,
    height: 700,
    theme: "light",
    showToolbar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Click the bar chart icon (📊) in the toolbar to open the Statistics panel showing workflow metrics, state breakdown, and complexity analysis.",
      },
    },
  },
};

/**
 * ## Statistics Panel (Dark Theme)
 *
 * Statistics panel in dark theme for a data processing workflow.
 */
export const StatisticsPanelDark: Story = {
  args: {
    definition: dataProcessingWorkflowDefinition,
    width: 1200,
    height: 700,
    theme: "dark",
    showToolbar: true,
  },
};

/**
 * ## Export Definition
 *
 * The toolbar includes an **Export** button (download icon) that
 * downloads the current workflow definition as a JSON file.
 *
 * Click the download icon in the toolbar to export.
 */
export const ExportDefinition: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 1000,
    height: 600,
    theme: "light",
    showToolbar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Click the download icon (⬇️) in the toolbar to export the workflow definition as a JSON file.",
      },
    },
  },
};

/**
 * ## Enhanced Search
 *
 * The search bar now includes a **filter dropdown** allowing you to search by:
 * - **All** — matches state names (default)
 * - **Name** — matches state names only
 * - **Type** — matches state type (Task, Choice, Wait, etc.)
 * - **Comment** — matches state comments
 * - **Resource** — matches AWS resource ARNs
 *
 * Try searching for "Task" with the Type filter, or "lambda" with
 * the Resource filter.
 */
export const EnhancedSearch: Story = {
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 1200,
    height: 700,
    theme: "light",
    showToolbar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The search bar includes a dropdown to filter by Name, Type, Comment, or Resource. Try searching for 'Task' with Type filter, or 'Payment' with Name filter.",
      },
    },
  },
};

/**
 * ## Circular Reference Detection
 *
 * This workflow contains a **cycle** (loop) where states reference each other
 * in a circular pattern. The viewer detects this and shows it as a **warning**
 * in validation, and the Statistics panel visualizes the cyclic paths.
 */
export const CycleDetection: Story = {
  args: {
    definition: cyclicWorkflowDefinition,
    width: 1000,
    height: 600,
    theme: "light",
    showToolbar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "This workflow contains circular references (loops). The validator detects cycles and reports them as warnings. Open the Statistics panel to see the cyclic paths visualized.",
      },
    },
  },
};

/**
 * ## Error Handling Workflow
 *
 * A comprehensive workflow demonstrating **Retry** and **Catch** error handling
 * patterns. The Statistics panel shows error handling coverage.
 */
export const ErrorHandlingShowcase: Story = {
  args: {
    definition: errorHandlingWorkflowDefinition,
    width: 1200,
    height: 700,
    theme: "dark",
    showToolbar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Showcases a workflow with extensive error handling (Retry + Catch). Open the Statistics panel to see error handling metrics.",
      },
    },
  },
};

/**
 * ## All Features Combined
 *
 * A fully-featured viewer with all interactive options enabled:
 * toolbar, minimap, draggable nodes, multi-select, and the new
 * statistics panel and export features.
 */
export const AllFeaturesCombined: Story = {
  args: {
    definition: ecommerceWorkflowDefinition,
    width: 1200,
    height: 800,
    theme: "soft",
    showToolbar: true,
    useMiniMap: true,
    useControls: true,
    isDraggable: true,
    isMultiSelect: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "All features enabled: toolbar with search/stats/export, minimap, draggable nodes, and multi-select.",
      },
    },
  },
};
