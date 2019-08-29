const merge = require('webpack-merge');
const Dotenv = require('dotenv-webpack');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new Dotenv({
      path: './production.env',
    }),
  ],
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
});
