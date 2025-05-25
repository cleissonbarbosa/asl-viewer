# ASL Viewer

A React library for visualizing AWS Step Functions workflows (Amazon States Language) in the browser. Built with TypeScript and based on the AWS Toolkit for VS Code.

## Features

- 🎨 **Visual Workflow Rendering** - Display ASL workflows as interactive graphs
- 🌓 **Theme Support** - Light and dark themes built-in
- ✅ **ASL Validation** - Comprehensive validation for ASL syntax and semantics
- 🔄 **Auto Layout** - Automatic graph layout using Dagre algorithm
- 📱 **Responsive** - Works on different screen sizes
- 🖱️ **Interactive** - Click handlers for states and connections
- 🔧 **Extensible** - Easy to customize and extend
- 📚 **TypeScript** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install asl-viewer
# or
yarn add asl-viewer
```

## Quick Start

```tsx
import React from 'react';
import { WorkflowViewer } from 'asl-viewer';

const workflow = {
  Comment: "A simple minimal example",
  StartAt: "Hello",
  States: {
    Hello: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:HelloWorld",
      End: true
    }
  }
};

function App() {
  return (
    <WorkflowViewer
      definition={workflow}
      theme="light"
      width={800}
      height={600}
    />
  );
}
```

## API Reference

### WorkflowViewer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `definition` | `ASLDefinition` | **required** | The ASL workflow definition |
| `theme` | `'light' \| 'dark'` | `'light'` | Visual theme |
| `width` | `number` | `800` | Viewer width in pixels |
| `height` | `number` | `600` | Viewer height in pixels |
| `readonly` | `boolean` | `true` | Whether the viewer is read-only |
| `onStateClick` | `(stateName: string) => void` | - | Callback when a state is clicked |
| `onConnectionClick` | `(from: string, to: string) => void` | - | Callback when a connection is clicked |
| `onError` | `(error: ValidationError[]) => void` | - | Callback for validation errors |

### Types

```tsx
import type {
  ASLDefinition,
  StateDefinition,
  StateType,
  ValidationError,
  WorkflowViewerProps
} from 'asl-viewer';
```

### Utilities

```tsx
import {
  validateASLDefinition,
  parseASLDefinition,
  createGraphLayout
} from 'asl-viewer';

// Validate an ASL definition
const errors = validateASLDefinition(workflow);

// Parse and get structured data
const parsed = parseASLDefinition(workflow);

// Create custom layout
const layout = createGraphLayout(parsed.nodes, parsed.connections);
```

## Supported ASL Features

- ✅ **Task States** - Lambda functions, activities, and other tasks
- ✅ **Choice States** - Conditional branching with choice rules
- ✅ **Pass States** - Data transformation and flow control
- ✅ **Wait States** - Delays and timeouts
- ✅ **Succeed/Fail States** - Terminal states
- ✅ **Parallel States** - Concurrent execution branches
- ✅ **Map States** - Iteration over arrays (basic support)
- ✅ **Retry/Catch** - Error handling configuration
- ✅ **Input/Output Processing** - Path expressions and filters

## Examples

Check out the `/examples` directory for complete usage examples:

- [Simple React App](./examples/react-app-example.tsx)
- [Complex Workflows](./examples/complex-workflow.json)
- [Parallel Execution](./examples/parallel-workflow.json)

## Development

### Setup

```bash
git clone <repository>
cd asl-viewer
yarn install
```

### Build

```bash
yarn build
```

### Storybook

```bash
yarn storybook
```

### Testing

```bash
yarn test
```

## Customization

### Custom Themes

```tsx
import { WorkflowViewer, getTheme } from 'asl-viewer';

const customTheme = {
  ...getTheme('light'),
  colors: {
    ...getTheme('light').colors,
    taskState: '#ff6b6b',
    choiceState: '#4ecdc4',
  }
};

<WorkflowViewer
  definition={workflow}
  theme={customTheme}
/>
```

### Custom State Rendering

The library provides granular components for custom implementations:

```tsx
import { GraphRenderer, StateComponent, ConnectionComponent } from 'asl-viewer';

// Use individual components for custom layouts
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `yarn test`
6. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on the AWS Toolkit for VS Code Step Functions visualization
- Inspired by the AWS Step Functions console
