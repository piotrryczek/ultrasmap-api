const merge = require('webpack-merge');
const Dotenv = require('dotenv-webpack');
const path = require('path');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  plugins: [
    new Dotenv({
      path: './.env.development',
    }),
  ],
  output: {
    filename: 'app_dev.js',
    path: path.resolve(__dirname, 'dist'),
  },
});
