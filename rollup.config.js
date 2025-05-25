import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
        exports: 'named',
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      postcss({
        extract: true,
        minimize: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.stories.*']
      }),
    ],
    external: ['react', 'react-dom', 'reactflow', '@reactflow/core', '@reactflow/controls', '@reactflow/background'],
  },
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/],
  },
];
