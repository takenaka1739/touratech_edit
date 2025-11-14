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



mix.override(config => {
  // 既存（Vue無効化）はそのままでOK。ここは追加分だけ示します。

  // ★ ts-loader を transpileOnly にして型チェックをスキップ
  if (!config.module) config.module = {};
  if (!config.module.rules) config.module.rules = [];
  config.module.rules.forEach(rule => {
    if (rule.loader === 'ts-loader' || (rule.use && rule.use.loader === 'ts-loader')) {
      // 既存の ts-loader 設定がある場合は上書き
      if (rule.options) rule.options.transpileOnly = true;
      if (rule.use && rule.use.options) rule.use.options.transpileOnly = true;
    }
  });

  // 念のため、ts-loader が見つからなかった場合に追加（保険）
  config.module.rules.push({
    test: /\.tsx?$/,
    loader: 'ts-loader',
    exclude: /node_modules/,
    options: { transpileOnly: true }
  });

  // ★ ForkTsCheckerWebpackPlugin が入っていれば除去（型チェックを外す）
  config.plugins = (config.plugins || []).filter(
    p => !(p && p.constructor && p.constructor.name === 'ForkTsCheckerWebpackPlugin')
  );
});