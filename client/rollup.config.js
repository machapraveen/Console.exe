// client/rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  // Browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'consoleExt',
      file: pkg.browser,
      format: 'umd',
      exports: 'named'
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        presets: [['@babel/preset-env', { targets: '> 0.25%, not dead' }]]
      }),
      terser()
    ]
  },
  // CommonJS (for Node) and ES module (for bundlers) build
  {
    input: 'src/index.js',
    output: [
      { file: pkg.main, format: 'cjs', exports: 'named' },
      { file: 'dist/console-ext.esm.js', format: 'es', exports: 'named' }
    ],
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        presets: [['@babel/preset-env', { targets: { node: '14' } }]]
      })
    ],
    external: ['axios']
  }
];