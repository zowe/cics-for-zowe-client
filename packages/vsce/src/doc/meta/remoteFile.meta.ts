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

import { IRemoteFile } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const RemoteFileMeta: IResourceMeta<IRemoteFile> = {
  resourceName: CicsCmciConstants.CICS_CMCI_REMOTE_FILE,
  humanReadableNamePlural: l10n.t("Remote Files"),
  humanReadableNameSingular: l10n.t("Remote File"),
  eibfnName: "FILE",
  helpTopicNameForSet: "commands-set-file",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `file=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_CMCI_REMOTE_FILE, "localFile");
  },

  getLabel: function (remoteFile: Resource<IRemoteFile>): string {
    return `${remoteFile.attributes.file}`;
  },

  getContext: function (remoteFile: Resource<IRemoteFile>): string {
    return `${CicsCmciConstants.CICS_CMCI_REMOTE_FILE}.${remoteFile.attributes.file}`;
  },

  getIconName: function (_remoteFile: Resource<IRemoteFile>): string {
    return `remote-file`;
  },

  getName(remoteFile: Resource<IRemoteFile>): string {
    return remoteFile.attributes.file;
  },

  getHighlights(resource: Resource<IRemoteFile>) {
    return [
      {
        key: l10n.t("Remote System"),
        value: resource.attributes.remotesystem,
      },
      {
        key: l10n.t("Remote Name"),
        value: resource.attributes.remotename,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_LOCAL_FILE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_LOCAL_FILE);
  },
};
