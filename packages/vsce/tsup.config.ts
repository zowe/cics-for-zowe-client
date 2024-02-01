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

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ["src/extension.ts"],
  // splitting: false,
  sourcemap: true,
  clean: true,
  format: "cjs",
  skipNodeModulesBundle: false,
  dts: true,
  external: ["vscode"],
  noExternal: ["@zowe/cics-for-zowe-sdk", "@zowe/zowe-explorer-api", "axios", "xml-js"],
  minify: "terser"
});