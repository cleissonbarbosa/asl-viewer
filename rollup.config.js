import { readFileSync } from "fs";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import { visualizer } from "rollup-plugin-visualizer";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: false,
        exports: "named",
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: false,
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
        modules: false, // Ensure CSS modules are not used by default
        to: "dist/index.css", // Explicitly name the CSS output for CJS
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
        declaration: true,
        declarationDir: "dist",
        jsx: "react-jsx", // Ensure JSX runtime is correctly handled
      }),
      terser(),
      visualizer({
        filename: "bundle-stats.html",
        open: false,
      }),
    ],
    // Runtime dependencies stay external; `reactflow/dist/style.css` is not
    // matched, so it is bundled into dist/index.css.
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "reactflow",
      "@tabler/icons-react",
      "js-yaml",
    ],
  },
  {
    input: "dist/index.d.ts",
    output: [
      { file: "dist/index.d.ts", format: "esm" },
      { file: "dist/index.d.cts", format: "esm" },
    ],
    plugins: [
      dts({
        respectExternal: true,
      }),
    ],
    external: [
      /\.css$/,
      "react",
      "react-dom",
      "react/jsx-runtime",
      "reactflow",
      "@tabler/icons-react",
      "js-yaml",
    ],
  },
];
