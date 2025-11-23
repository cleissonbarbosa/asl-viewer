import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkflowViewer } from "../WorkflowViewer";
import { createCustomTheme } from "../../core/theme";
import {
  complexWorkflowDefinition,
  simpleWorkflow,
  customThemeWorkflow,
} from "./workflow-definitions";

const meta: Meta<typeof WorkflowViewer> = {
  title: "Components/WorkflowViewer/Themes",
  component: WorkflowViewer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Different theme variations for the WorkflowViewer component.",
      },
    },
  },
  tags: ["autodocs", "themes"],
  argTypes: {
    theme: {
      control: { type: "select" },
      options: ["light", "dark", "highContrast", "soft", "custom"],
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
    useMiniMap: {
      control: { type: "boolean" },
      description: "Whether to display a MiniMap in the viewer",
    },
    useControls: {
      control: { type: "boolean" },
      description: "Whether to display viewer controls (zoom, fit view, etc.)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Light theme - default appearance
 */
export const LightTheme: Story = {
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
        story: "The default light theme with clean, bright colors",
      },
    },
  },
};

/**
 * Dark theme for low-light environments
 */
export const DarkTheme: Story = {
  args: {
    definition: complexWorkflowDefinition,
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
          "Dark theme ideal for low-light environments or dark mode interfaces",
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
 * High contrast theme for accessibility
 */
export const HighContrastTheme: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "highContrast",
    readonly: true,
    useMiniMap: true,
    useControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: "High contrast theme for better accessibility and visibility",
      },
    },
  },
};

/**
 * Soft theme with muted colors
 */
export const SoftTheme: Story = {
  args: {
    definition: complexWorkflowDefinition,
    width: 800,
    height: 600,
    theme: "soft",
    readonly: true,
    useMiniMap: true,
    useControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Soft theme with muted, gentle colors for a subtle appearance",
      },
    },
  },
};

/**
 * Custom theme example showing how to create custom themes
 */
export const CustomThemeExample: Story = {
  render: () => {
    // Create a custom purple theme
    const customTheme = createCustomTheme("dark", {
      name: "customPurple",
      background: "#1a0033",
      surfaceColor: "#2d1b69",
      nodeColors: {
        task: "#4c1d95",
        choice: "#7c2d12",
        succeed: "#065f46",
      },
      nodeBorderColors: {
        task: "#8b5cf6",
        choice: "#f59e0b",
        succeed: "#10b981",
      },
      textColor: "#e879f9",
      connectionColor: "#c084fc",
      tooltipBackground: "#3c004d",
      tooltipTextColor: "#f0f0f0",
    });

    return (
      <div style={{ padding: "20px" }}>
        <h3>Custom Purple Theme</h3>
        <WorkflowViewer
          definition={customThemeWorkflow}
          theme={customTheme}
          width={600}
          height={400}
          useControls={true}
          useMiniMap={true}
          readonly={true}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example of creating a custom theme with purple color scheme",
      },
    },
  },
};

/**
 * Theme showcase - all themes side by side
 */
export const ThemeShowcase: Story = {
  render: () => {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          padding: "20px",
        }}
      >
        <div>
          <h3>Light Theme</h3>
          <WorkflowViewer
            definition={simpleWorkflow}
            theme="light"
            width={400}
            height={300}
            useControls={false}
            useMiniMap={false}
            readonly={true}
          />
        </div>
        <div>
          <h3>Dark Theme</h3>
          <WorkflowViewer
            definition={simpleWorkflow}
            theme="dark"
            width={400}
            height={300}
            useControls={false}
            useMiniMap={false}
            readonly={true}
          />
        </div>
        <div>
          <h3>High Contrast Theme</h3>
          <WorkflowViewer
            definition={simpleWorkflow}
            theme="highContrast"
            width={400}
            height={300}
            useControls={false}
            useMiniMap={false}
            readonly={true}
          />
        </div>
        <div>
          <h3>Soft Theme</h3>
          <WorkflowViewer
            definition={simpleWorkflow}
            theme="soft"
            width={400}
            height={300}
            useControls={false}
            useMiniMap={false}
            readonly={true}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Comparison of all available themes in a grid layout",
      },
    },
  },
};
