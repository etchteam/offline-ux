import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import { injectManifest } from 'rollup-plugin-workbox';
import workboxConfig from './workbox-config.js';

export default [{
  input: 'service-worker-template.js',
  output: { dir: 'dist', format: 'cjs' },
  plugins: [injectManifest(workboxConfig)]
}, {
  input: 'dist/service-worker.js',
  output: { dir: 'dist', format: 'cjs' },
  plugins: [
    resolve(),
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    terser(),
    copy({
      targets: [{ src: 'src/*', dest: 'dist/' }]
    })
  ]
}];