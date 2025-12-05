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

import { ITask } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const TaskMeta: IResourceMeta<ITask> = {
  resourceName: CicsCmciConstants.CICS_CMCI_TASK,
  humanReadableNamePlural: l10n.t("Tasks"),
  humanReadableNameSingular: l10n.t("Task"),

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `TRANID=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_CMCI_TASK, "tasks");
  },

  getLabel: function (resource: Resource<ITask>): string {
    let label = `${resource.attributes.task} - ${resource.attributes.tranid}`;

    if (resource.attributes.runstatus.trim().toLowerCase() !== "suspended") {
      const status = resource.attributes.runstatus.trim().toLowerCase();
      label += ` (${status.charAt(0).toUpperCase()}${status.slice(1)})`;
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

  getHighlights(resource: Resource<ITask>) {
    return [
      {
        key: l10n.t("Run Status"),
        value: resource.attributes.runstatus,
      },
      {
        key: l10n.t("Suspend Time"),
        value: resource.attributes.suspendtime,
      },
      {
        key: l10n.t("Suspend Type"),
        value: resource.attributes.suspendtype,
      },
      {
        key: l10n.t("Suspend Value"),
        value: resource.attributes.suspendvalue,
      },
      {
        key: l10n.t("User ID"),
        value: resource.attributes.userid,
      },
      {
        key: l10n.t("Transaction ID"),
        value: resource.attributes.tranid,
      },
      {
        key: l10n.t("Current Program"),
        value: resource.attributes.currentprog,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_LOCAL_TRANSACTION, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_LOCAL_TRANSACTION);
  },

  maximumPrimaryKeyLength: 4,
};
