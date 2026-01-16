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

import { ISharedTSQueue } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const SharedTSQueueMeta: IResourceMeta<ISharedTSQueue> = {
  resourceName: CicsCmciConstants.CICS_CMCI_SHARED_TS_QUEUE,
  humanReadableNamePlural: l10n.t("Shared TS Queues"),
  humanReadableNameSingular: l10n.t("Shared TS Queue"),
  eibfnName: "TSQUEUE",
  helpTopicNameForSet: "commands-set-tsqueue-tsqname#dfha8gg__title__6",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `NAME=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return "NAME=*";
  },

  getLabel: function (tsQueue: Resource<ISharedTSQueue>): string {
    return tsQueue.attributes.name;
  },

  getContext: function (tsQueue: Resource<ISharedTSQueue>): string {
    return `${CicsCmciConstants.CICS_CMCI_SHARED_TS_QUEUE}.${tsQueue.attributes.name}`;
  },

  getIconName: function (_tsQueue: Resource<ISharedTSQueue>): string {
    return `shared-tsqueue`;
  },

  getHighlights(program: Resource<ISharedTSQueue>) {
    return [
      {
        key: l10n.t("Location"),
        value: program.attributes.location,
      },
      {
        key: l10n.t("Pool Name"),
        value: program.attributes.poolname,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_TS_QUEUE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_TS_QUEUE);
  },

  getName(tsQueue: Resource<ISharedTSQueue>): string {
    return tsQueue.attributes.name;
  },

  filterCaseSensitive: true,
};
