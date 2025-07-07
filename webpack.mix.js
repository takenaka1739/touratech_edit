const mix = require('laravel-mix');
const tailwindcss = require('tailwindcss');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

require('laravel-mix-polyfill');
// require('laravel-mix-bundle-analyzer');

mix.webpackConfig({
  output: {
    chunkFilename: 'assets/js/[name].js' + (mix.inProduction() ? '?id=[Chunkhash]' : ''),
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
  },
});

// mix.babelConfig({
//   plugins: ['@babel/plugin-syntax-dynamic-import'],
// });

mix
  .ts('resources/ts/index.tsx', 'public/assets/js')
  .sass('resources/sass/login.scss', 'public/assets/css')
  .sass('resources/sass/index.scss', 'public/assets/css')
  .sourceMaps(true)
  .options({
    processCssUrls: false,
    postCss: [tailwindcss('./tailwind.config.js')],
  })
  .polyfill({
    enabled: true,
    useBuiltIns: 'entry',
    targets: 'IE 11',
  });

mix.disableNotifications();

// mix.dump();
// if (!mix.inProduction()) {
// mix.bundleAnalyzer();
// }
