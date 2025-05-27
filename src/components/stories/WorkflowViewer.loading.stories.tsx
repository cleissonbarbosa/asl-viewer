import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { WorkflowViewer } from "../WorkflowViewer";
import { FileUploader, URLInput } from "../FileUploader";
import { getTheme } from "../../utils/theme";

const meta: Meta<typeof WorkflowViewer> = {
  title: "Components/WorkflowViewer/Loading",
  component: WorkflowViewer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Examples showing how to load workflows from URLs and files.",
      },
    },
  },
  tags: ["autodocs", "loading"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Load workflow from URL
 */
export const LoadFromURL: Story = {
  render: (args) => {
    const [currentUrl, setCurrentUrl] = React.useState<string>(
      "https://raw.githubusercontent.com/aws-samples/aws-stepfunctions-examples/refs/heads/main/sam/demo-asl-features/template.yaml",
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
    useMiniMap: true,
    useControls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Load and display workflows from remote URLs. Supports both JSON and YAML formats.",
      },
    },
  },
};

/**
 * Load workflow from file upload
 */
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
    useMiniMap: true,
    useControls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Upload and visualize workflow files from your local system. Supports .json and .yaml/.yml files.",
      },
    },
  },
};

/**
 * URL loading with dark theme
 */
export const URLLoadingDarkTheme: Story = {
  render: (args) => {
    const [currentUrl, setCurrentUrl] = React.useState<string>(
      "https://raw.githubusercontent.com/aws-samples/aws-stepfunctions-examples/refs/heads/main/sam/demo-asl-features/template.yaml",
    );

    return (
      <div
        style={{
          width: args.width || 800,
          height: (args.height || 600) + 100,
          backgroundColor: "#1a1a1a",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <URLInput
            onUrlSubmit={setCurrentUrl}
            theme={getTheme("dark")}
            defaultValue="https://raw.githubusercontent.com/aws-samples/aws-stepfunctions-examples/refs/heads/main/sam/demo-asl-features/template.yaml"
            placeholder="Enter workflow URL..."
          />
        </div>
        <WorkflowViewer
          {...args}
          url={currentUrl}
          onLoadStart={() => console.log("Dark theme loading started")}
          onLoadEnd={() => console.log("Dark theme loading finished")}
          onLoadError={(error) =>
            console.error("Dark theme loading error:", error)
          }
        />
      </div>
    );
  },
  args: {
    width: 800,
    height: 500,
    theme: "dark",
    readonly: true,
    useMiniMap: true,
    useControls: true,
  },
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story: "URL loading with dark theme styling for the input and viewer",
      },
    },
  },
};

/**
 * File loading with interactive features
 */
export const InteractiveFileLoading: Story = {
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
            <div
              style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}
            >
              <strong>File:</strong> {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(1)} KB)
              <br />
              <strong>Type:</strong> {selectedFile.type || "Unknown"}
              <br />
              <strong>Last Modified:</strong>{" "}
              {new Date(selectedFile.lastModified).toLocaleString()}
            </div>
          )}
        </div>
        <WorkflowViewer
          {...args}
          file={selectedFile || undefined}
          onLoadStart={() => console.log("Interactive loading started")}
          onLoadEnd={() => console.log("Interactive loading finished")}
          onLoadError={(error) =>
            console.error("Interactive loading error:", error)
          }
          onStateClick={(state) =>
            console.log("State clicked in loaded workflow:", state)
          }
        />
      </div>
    );
  },
  args: {
    width: 800,
    height: 500,
    theme: "light",
    readonly: false,
    useMiniMap: true,
    useControls: true,
    isDraggable: true,
    isSelectable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "File loading with full interactive features enabled and detailed file information display",
      },
    },
  },
};
