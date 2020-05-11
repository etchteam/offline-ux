const resolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const { terser } = require('rollup-plugin-terser');
const { injectManifest } = require('rollup-plugin-workbox');
const workboxConfig = require('./workbox-config.js')

export default [{
  input: 'service-worker-template.js',
  output: {
    dir: 'src',
    format: 'cjs'
  },
  plugins: [injectManifest(workboxConfig)]
}, {
  input: 'service-worker.js',
  output: {
    dir: 'src',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    terser()
  ]
}];