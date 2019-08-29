const merge = require('webpack-merge');
const Dotenv = require('dotenv-webpack');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new Dotenv({
      path: './.env.production',
    }),
  ],
  output: {
    filename: 'app_prod.js',
    path: path.resolve(__dirname, 'dist'),
  },
});
