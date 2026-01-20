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

import { ITSQueue } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const TSQueueMeta: IResourceMeta<ITSQueue> = {
  resourceName: CicsCmciConstants.CICS_CMCI_TS_QUEUE,
  humanReadableNamePlural: l10n.t("TS Queues"),
  humanReadableNameSingular: l10n.t("TS Queue"),
  eibfnName: "TSQUEUE",
  queryParamForSet: "commands-set-tsqueue-tsqname",
  anchorFragmentForSet: "dfha8gg__title__6",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `NAME=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return "NAME=*";
  },

  getLabel: function (tsQueue: Resource<ITSQueue>): string {
    return tsQueue.attributes.name;
  },

  getContext: function (tsQueue: Resource<ITSQueue>): string {
    return `${CicsCmciConstants.CICS_CMCI_TS_QUEUE}.${tsQueue.attributes.name}`;
  },

  getIconName: function (_tsQueue: Resource<ITSQueue>): string {
    return `tsqueue`;
  },

  getHighlights(program: Resource<ITSQueue>) {
    return [
      {
        key: l10n.t("Location"),
        value: program.attributes.location,
      },
      {
        key: l10n.t("Number of Items"),
        value: program.attributes.numitems,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_TS_QUEUE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_TS_QUEUE);
  },

  getName(tsQueue: Resource<ITSQueue>): string {
    return tsQueue.attributes.name;
  },

  filterCaseSensitive: true,
};
