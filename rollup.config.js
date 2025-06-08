import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";
import { readFileSync } from "fs";
import terser from "@rollup/plugin-terser"; // Corrected import
import { visualizer } from "rollup-plugin-visualizer"; // Corrected import for visualizer

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: false, // Disable sourcemaps for production
        exports: "named",
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: false, // Disable sourcemaps for production
        exports: "named",
      },
    ],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      postcss({
        extract: true,
        minimize: true,
        sourceMap: false,
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        exclude: [
          "**/*.test.*",
          "**/*.stories.*",
          "**/stories/**",
          "**/__tests__/**",
          "**/examples/**",
          "**/docs/**",
        ],
        sourceMap: false,
        declaration: true, // Ensure declarations are generated
        declarationDir: "dist", // Specify declaration output directory
      }),
      terser(), // Add terser plugin for minification
      visualizer({ // Add visualizer plugin
        filename: "bundle-stats.html",
        open: true, // Automatically open the report in the browser
      }),
    ],
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "reactflow",
      "@reactflow/core",
      "@reactflow/controls",
      "@reactflow/background",
      "@reactflow/minimap",
      "@tabler/icons-react",
      "js-yaml",
    ],
  },
  {
    input: "dist/index.d.ts", // Ensure this path is correct
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [
      dts({
        respectExternal: true,
      }),
    ],
    external: [
      /\.css$/,
      "react",
      "react-dom",
      "reactflow",
      "@reactflow/core",
      "@reactflow/controls",
      "@reactflow/background",
      "@reactflow/minimap",
      "@tabler/icons-react",
      "js-yaml",
    ],
  },
];
