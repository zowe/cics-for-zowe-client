//@ts-check

'use strict';

const path = require('path');
const WebpackManifestPlugin = require('webpack-manifest-plugin').WebpackManifestPlugin;

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/
const extensionConfig = {
  target: 'node',
  entry: {
    extension: './src/extension.ts'
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  externals: [
    {
      vscode: 'commonjs vscode',
    },
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        // exclude: /.*node_modules.*/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\.node/,
        use: "raw-loader"
      },
      {
        test: /\.js$/,
        include: /wontache/,
        type: "javascript/auto",
      }
    ]
  },
  infrastructureLogging: {
    level: 'log'
  }
};

function webviews(mode) {
  const config = {
    name: "cics-webviews",
    target: "web",
    devtool: "source-map",
    // devtool: mode === 'development' ? 'eval' : false,
    entry: {
      resourceInspectorPanelView: {
        import: path.resolve(__dirname, "src/webviews/resource-inspector-panel/index.tsx"),
        // dependOn: 'sharedModules'
      },
      // sharedModules: ['react', 'react-dom']
    },
    // entry: path.resolve(__dirname, 'src/webviews/resource-inspector-panel/index.tsx'),
    output: {
      // globalObject: 'self',
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      // chunkFilename: 'chunks/[id].[name].chunk.js',
      // devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|tsx|ts)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
            },
          ],
        },
        {
          test: /\.(css)$/,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
            },
          ],
        },
      ],
    },
    performance: {
      hints: "error",
      maxEntrypointSize: 2000000,
      maxAssetSize: 2000000,
    },
    plugins: [
      new WebpackManifestPlugin({ publicPath: "" }),
      // new webpack.BannerPlugin(fs.readFileSync('../../scripts/LICENSE_HEADER', 'utf8')),
      // new MonacoWebpackPlugin({ languages: ['java'] })
    ],
    devServer: {
      compress: true,
      port: 9000,
      hot: true,
      allowedHosts: "all",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  };
  return config;
}

module.exports = (options) => {
  const mode = options.mode;
  return [extensionConfig, webviews(mode)];
};
