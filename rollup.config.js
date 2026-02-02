import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// noinspection JSUnusedGlobalSymbols
const convertSvgPlugin = {
  name: 'convert-svg',
  buildStart() {
    const svg = readFileSync('icon.svg', 'utf-8');
    mkdirSync('dist/icons', { recursive: true });

    for (const size of [16, 48, 128]) {
      const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: size },
      });
      const png = resvg.render().asPng();
      writeFileSync(`dist/icons/icon-${size}.png`, png);
    }
  },
};

// noinspection JSUnusedGlobalSymbols
const zipPlugin = () => ({
  name: 'zip-plugin',
  async writeBundle() {
    await execAsync("cd dist && zip -r extension.zip . -x '*.zip'");
    console.log('Created dist/extension.zip');
  },
});

// noinspection JSUnusedGlobalSymbols
export default {
  input: 'src/background.ts',
  output: {
    file: 'dist/background.js',
    format: 'iife',
    name: 'TextSaverExtension',
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        module: 'ES2022',
        moduleResolution: 'bundler',
        importHelpers: false,
        declaration: false,
        sourceMap: true,
        lib: ['ES2022', 'WebWorker'],
      },
    }),
    terser({
      sourceMap: true,
    }),
    convertSvgPlugin,
    copy({
      targets: [{ src: 'manifest.json', dest: 'dist' }],
    }),
    zipPlugin(),
  ],
};
