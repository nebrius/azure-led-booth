const { join } = require('path');

module.exports = (env, argv) => ({
  entry: {
    basic: './src/basic.tsx',
    custom: './src/custom.tsx',
  },

  mode: argv.mode,

  output: {
    filename: '[name].js',
    path: join(__dirname, 'dist')
  },

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

});
