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

const fs = require("fs");

const packageHeaderMap = {
  'packages/vsce/NOTICE': "IBM CICS for Zowe Explorer",
  'packages/sdk/NOTICE': "IBM CICS for Zowe SDK",
  'packages/cli/NOTICE': "IBM CICS Plug-in for Zowe CLI"
};
const getHeader = (noticeFilePath) => {
  return `The package ${packageHeaderMap[noticeFilePath]} may contain the following external ` +
    `packages and source code, with the applicable license information listed:` +
    require("os").EOL +
    require("os").EOL;
};

(async () => {
  const filePaths = await require("glob").glob("packages/*/NOTICE");

  for (const filePath of filePaths) {
    const file = fs.readFileSync(filePath);
    const result = file.toString();

    const header = getHeader(filePath);
    if (!result.startsWith(header)) {
      fs.writeFileSync(filePath, header + result);
    }
  }
})();
