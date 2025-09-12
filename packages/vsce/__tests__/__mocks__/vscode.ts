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

import { createVSCodeMock } from "jest-mock-vscode";

const mock = createVSCodeMock(jest);

module.exports = {
  ...mock,
  extensions: {
    getExtension: (v: string) => { }
  },
  env: {
    clipboard: {
      writeText: (v: string) => { }
    }
  }
}

