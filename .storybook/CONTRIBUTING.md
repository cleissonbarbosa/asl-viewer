# Contributing to Storybook

This project uses Storybook to showcase components and provide interactive documentation.

## Adding New Stories

1. Create a new `.stories.tsx` file in the same directory as your component
2. Follow the existing pattern in `WorkflowViewer.stories.tsx`
3. Export your stories with descriptive names

### Example Structure

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { YourComponent } from "./YourComponent";

const meta: Meta<typeof YourComponent> = {
  title: "Components/YourComponent",
  component: YourComponent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Your component props
  },
};
```

## Running Storybook Locally

```bash
yarn storybook
```

This will start Storybook on `http://localhost:6006`

## Building for Production

```bash
yarn build-storybook:gh-pages
```

## Deployment

Storybook is automatically deployed to GitHub Pages when changes are pushed to the main branch. The deployment workflow:

1. Builds the Storybook static files
2. Deploys to GitHub Pages
3. Makes it available at https://cleissonb.github.io/asl-viewer/

## Best Practices

- Include multiple story variants (e.g., Default, WithCustomTheme, ErrorState)
- Add proper controls for interactive props
- Use descriptive story names
- Include documentation in the story metadata
- Test stories with both light and dark themes
