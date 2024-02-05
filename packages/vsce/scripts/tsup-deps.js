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

const vscePackageJson = require(__dirname + "/../package.json");
const tsupConfigJson = require(__dirname + "/../tsup.config.json");

tsupConfigJson.noExternal = [];
if (process.argv[2] === "add") {
  for (const dep in vscePackageJson.dependencies) {
    tsupConfigJson.noExternal.push(dep);
  }
}
require("fs").writeFileSync(__dirname + "/../tsup.config.json", JSON.stringify(tsupConfigJson, null, 2));