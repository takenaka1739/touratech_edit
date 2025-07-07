const path = require('path');
const mixConfig = require('../node_modules/laravel-mix/setup/webpack.config');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
    stories: ['../resources/ts/**/*.stories.@(tsx|mdx)'],
    addons: [
        '@storybook/addon-actions',
        '@storybook/addon-links',
        '@storybook/addon-controls',
        '@storybook/addon-docs',
    ],
    webpackFinal: config => {
        return {
            ...config,
            module: {
                ...config.module,
                rules: mixConfig.module.rules,
            },
            resolve: {
                ...config.resolve,
                plugins: [new TsconfigPathsPlugin()],
            },
        };
    },
};
