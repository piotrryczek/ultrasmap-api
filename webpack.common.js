module.exports = {
  mode: 'production',
  target: 'node',
  entry: ['@babel/polyfill', `${__dirname}/src/server.js`],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
        resolve: {
          extensions: ['.js', '.jsx'],
        },
      },
    ],
  },
};
