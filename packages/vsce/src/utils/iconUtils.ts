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

export function getIconPathInResources(iconFileNameLight: string, iconFileNameDark: string): { light: string; dark: string } {
  return {
    // We bundle the extension into a single `dist/extension.js`
    // `__dirname/../resources/imgs === `/path/to/dist/../resources/imgs`
    light: join(__dirname, "..", "resources", "imgs", iconFileNameLight),
    dark: join(__dirname, "..", "resources", "imgs", iconFileNameDark),
  };
}

export function getIconOpen(open: boolean = true) {
  return getIconPathInResources(`folder-${open ? "open" : "closed"}-dark.svg`, `folder-${open ? "open" : "closed"}-light.svg`);
}

export function getIconByStatus(resourceType: string, resourceTreeItem: any) {
  switch (resourceType) {
    case "PROGRAM":
      return resourceTreeItem.status === "DISABLED"
        ? getIconPathInResources("program-disabled-dark.svg", "program-disabled-light.svg")
        : getIconPathInResources("program-dark.svg", "program-light.svg");
    case "TRANSACTION":
      return resourceTreeItem.status === "DISABLED"
        ? getIconPathInResources("local-transaction-disabled-dark.svg", "local-transaction-disabled-light.svg")
        : getIconPathInResources("local-transaction-dark.svg", "local-transaction-light.svg");
    case "LOCAL_FILE":
      return resourceTreeItem.openstatus === "CLOSED" && resourceTreeItem.enablestatus === "DISABLED"
        ? getIconPathInResources("local-file-disabled-closed-dark.svg", "local-file-disabled-closed-light.svg")
        : resourceTreeItem.openstatus === "CLOSED"
          ? getIconPathInResources("local-file-closed-dark.svg", "local-file-closed-light.svg")
          : resourceTreeItem.enablestatus === "DISABLED"
            ? getIconPathInResources("local-file-disabled-dark.svg", "local-file-disabled-light.svg")
            : getIconPathInResources("local-file-dark.svg", "local-file-light.svg");
    case "TASK":
      return resourceTreeItem.runstatus === "RUNNING"
        ? getIconPathInResources("task-running-dark.svg", "task-running-light.svg")
        : resourceTreeItem.runstatus === "SUSPENDED"
          ? getIconPathInResources("task-suspended-dark.svg", "task-suspended-light.svg")
          : getIconPathInResources("task-dispatched-dark.svg", "task-dispatched-light.svg");
  }
}
