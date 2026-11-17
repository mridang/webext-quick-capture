/**
 * @file Rollup build configuration that bundles the background worker and copies the extension assets.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import { Resvg } from '@resvg/resvg-js';

// noinspection JSUnusedGlobalSymbols
const convertSvgPlugin = {
  name: 'convert-svg',
  async buildStart() {
    const svg = await readFile('icon.svg', 'utf8');
    await mkdir('dist/icons', { recursive: true });

    await Promise.all(
      [16, 48, 128].map((size) => {
        const resvg = new Resvg(svg, {
          fitTo: { mode: 'width', value: size },
        });
        const png = resvg.render().asPng();
        return writeFile(`dist/icons/icon-${size}.png`, png);
      }),
    );
  },
};

// noinspection JSUnusedGlobalSymbols
export default {
  input: 'src/background.ts',
  output: {
    file: 'dist/background.js',
    format: 'iife',
    name: 'ScreenshotCapturerExtension',
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
      targets: [
        { src: 'manifest.json', dest: 'dist' },
        { src: 'src/offscreen.html', dest: 'dist' },
        { src: 'src/offscreen.js', dest: 'dist' },
        {
          src: 'assets/camera-shutter-click-03.mp3',
          dest: 'dist/assets',
        },
      ],
    }),
  ],
};
