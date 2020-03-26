const metalsmith = require('metalsmith');
const marked = require('marked');
const markdown = require('metalsmith-markdown');
const layouts = require('metalsmith-layouts');
const postCSS = require('metalsmith-with-postcss');
const prism = require('metalsmith-prism');
const cleanCSS = require('metalsmith-clean-css');
const minifyHTML = require('metalsmith-html-minifier');

const renderer = new marked.Renderer();
renderer.link = function(href) {
  const link = marked.Renderer.prototype.link.apply(this, arguments);
  return href.includes('http') || href.includes('https')
    ? link.replace(/^<a/, '<a target="_blank" rel="noopener noreferrer"')
    : link;
};

metalsmith(__dirname)
  .source('./src')
  .destination('./public')
  .clean(true)
  .use(markdown({
    renderer
  }))
  .use(layouts({
    directory: './src/layouts'
  }))
  .use(postCSS({
    plugins: {
      'postcss-import': {},
      'postcss-preset-env': {
        features: {
          'nesting-rules': true
        }
      }
    }
  }))
  .use(prism())
  .use(cleanCSS({
    files: 'src/styles/*.css'
  }))
  .use(minifyHTML())
  .build((err) => {
    if (err) {
      throw err;
    }
    console.log('Build finished!');
  });



