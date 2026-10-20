import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// The promo renders the library straight from source, so the video always
// shows the current version of the components.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  resolve: {
    alias: {
      "asl-viewer": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
  esbuild: { jsx: "automatic" },
  build: { outDir: "dist", emptyOutDir: true },
  server: { port: 5199, strictPort: true },
  preview: { port: 5199, strictPort: true },
});
