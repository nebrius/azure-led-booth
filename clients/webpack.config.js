const { join } = require('path');
const { DefinePlugin } = require('webpack');

module.exports = (env, argv) => {
  let PRODUCTION_ENDPOINT;
  if (argv.mode === 'production') {
    PRODUCTION_ENDPOINT = process.env.PRODUCTION_ENDPOINT;
    if (!PRODUCTION_ENDPOINT) {
      throw new Error('You must set the PRODUCTION_ENDPOINT environment variable when building for production');
    }
  }
  const config = {
    entry: {
      basic: './src/basic.tsx',
      custom: './src/custom.tsx',
    },

    mode: argv.mode,

    devtool: argv.mode === 'development' ? 'inline-source-map' : undefined,

    output: {
      filename: '[name].js',
      path: join(__dirname, 'dist')
    },

    resolve: {
      // Add '.ts' and '.tsx' as resolvable extensions.
      extensions: ['.ts', '.tsx', '.js', '.json'],
      symlinks: false
    },

    plugins: [
      new DefinePlugin({
        API_ENDPOINT: argv.mode === 'development' ?
          '"http://localhost:7071/api/"' :
          `"${PRODUCTION_ENDPOINT}"`
      })
    ],

    module: {
      rules: [
        // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
        { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }
      ]
    }
  };
  return config;
};
