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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { Resource } from "../../resources/Resource";
import { PersistentStorage } from "../../utils/PersistentStorage";
import { ITask } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

export const TaskMeta: IResourceMeta<ITask> = {
  resourceName: CicsCmciConstants.CICS_CMCI_TASK,
  humanReadableName: "Tasks",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `TRANID=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_CMCI_TASK);
  },

  getLabel: function (resource: Resource<ITask>): string {
    let label = `${resource.attributes.task} - ${resource.attributes.tranid}`;

    if (resource.attributes.runstatus.trim().toLowerCase() !== "suspended") {
      label += ` (${resource.attributes.runstatus})`;
    }

    return label;
  },

  getContext: function (resource: Resource<ITask>): string {
    return `${CicsCmciConstants.CICS_CMCI_TASK}.${resource.attributes.task}`;
  },

  getIconName: function (resource: Resource<ITask>): string {
    let iconName = "task";
    switch (resource.attributes.runstatus.trim().toLowerCase()) {
      case "running":
        iconName += `-running`;
        break;
      case "suspended":
        iconName += `-suspended`;
        break;
      case "dispatched":
        iconName += `-dispatched`;
        break;
    }
    return iconName;
  },

  getName(resource: Resource<ITask>): string {
    return resource.attributes.task;
  },
};
