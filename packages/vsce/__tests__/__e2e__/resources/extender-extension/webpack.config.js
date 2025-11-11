/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

//@ts-check

"use strict";

const path = require("path");

module.exports = () => {
  return [{
    target: "node",
    entry: { extension: "./src/extension.ts", },
    devtool: "source-map",
    output: {
      path: path.resolve(__dirname, "out"),
      filename: "[name].js",
      libraryTarget: "commonjs2",
      devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    plugins: [],
    externals: [{ vscode: "commonjs vscode", },],
    resolve: { extensions: [".ts", ".js"], },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: "ts-loader",
            },
          ],
        },
      ],
    },
    infrastructureLogging: { level: "log", },
  }];
};
