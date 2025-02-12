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

import { join } from "path";

export function getIconFilePathFromName(iconFileName: string): { light: string; dark: string; } {
  return {
    // We bundle the extension into a single `dist/extension.js`
    // `__dirname/../resources/imgs === `/path/to/dist/../resources/imgs`
    light: join(__dirname, "..", "resources", "imgs", iconFileName + "-dark.svg"),
    dark: join(__dirname, "..", "resources", "imgs", iconFileName + "-light.svg"),
  };
}

export function getFolderIcon(open: boolean = true) {
  return getIconFilePathFromName(`folder-${open ? "open" : "closed"}`);
}
