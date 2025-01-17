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

export function getIconPathInResources(iconFileName: string): { light: string; dark: string } {
  return {
    // We bundle the extension into a single `dist/extension.js`
    // `__dirname/../resources/imgs === `/path/to/dist/../resources/imgs`
    light: join(__dirname, "..", "resources", "imgs", iconFileName + "-light.svg"),
    dark: join(__dirname, "..", "resources", "imgs", iconFileName + "-dark.svg"),
  };
}

export function getIconOpen(open: boolean = true) {
  return getIconPathInResources(`folder-${open ? "open" : "closed"}`);
}

export function getIconRootName(resourceType: string, resourceTreeItem: any) {
  switch (resourceType) {
    case "PROGRAM":
      return resourceTreeItem.status === "DISABLED" ? "program-disabled" : "program";
    case "TRANSACTION":
      return resourceTreeItem.status === "DISABLED" ? "local-transaction-disabled" : "local-transaction";
    case "LOCAL_FILE":
      return resourceTreeItem.openstatus === "CLOSED" && resourceTreeItem.enablestatus === "DISABLED"
        ? "local-file-disabled-closed"
        : resourceTreeItem.openstatus === "CLOSED"
          ? "local-file-closed"
          : resourceTreeItem.enablestatus === "DISABLED"
            ? "local-file-disabled"
            : "local-file";
    case "TASK":
      return resourceTreeItem.runstatus === "RUNNING"
        ? "task-running"
        : resourceTreeItem.runstatus === "SUSPENDED"
          ? "task-suspended"
          : "task-dispatched";
  }
}

export function getIconByStatus(resourceType: string, resourceTreeItem: any) {
  return getIconPathInResources(getIconRootName(resourceType, resourceTreeItem));
}