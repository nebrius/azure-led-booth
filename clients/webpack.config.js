const { join } = require('path');

module.exports = {
  entry: {
    basic: './src/basic.tsx',
    custom: './src/custom.tsx',
  },

  mode: 'development',

  output: {
    filename: '[name].js',
    path: join(__dirname, 'dist')
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'inline-source-map',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
    symlinks: false
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }
    ]
  }

};
