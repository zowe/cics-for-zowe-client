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

import type { ILocalFile } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import type { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import type { IResourceMeta } from "./IResourceMeta";

export const LocalFileMeta: IResourceMeta<ILocalFile> = {
  resourceName: CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
  humanReadableNamePlural: l10n.t("Local Files"),
  humanReadableNameSingular: l10n.t("Local File"),
  eibfnName: "FILE",
  setCommandDocFile: "dfha8_setfile.html",
  anchorFragmentForSet: "dfha8fi__conditions",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `file=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_CMCI_LOCAL_FILE, "localFile");
  },

  getLabel: function (localFile: Resource<ILocalFile>): string {
    let label = `${localFile.attributes.file}`;

    if (localFile.attributes.enablestatus.trim().toLowerCase() !== "enabled") {
      const status = localFile.attributes.enablestatus.trim().toLowerCase();
      label += ` (${status.charAt(0).toUpperCase()}${status.slice(1)})`;
    }

    if (localFile.attributes.openstatus.trim().toLowerCase() !== "open") {
      const status = localFile.attributes.openstatus.trim().toLowerCase();
      label += ` (${status.charAt(0).toUpperCase()}${status.slice(1)})`;
    }

    return label;
  },

  getContext: function (localFile: Resource<ILocalFile>): string {
    return `${
      CicsCmciConstants.CICS_CMCI_LOCAL_FILE
    }.${localFile.attributes.enablestatus.toUpperCase()}.${localFile.attributes.openstatus.toUpperCase()}.${localFile.attributes.file}`;
  },

  getIconName: function (localFile: Resource<ILocalFile>): string {
    let iconName = `local-file`;
    if (localFile.attributes.enablestatus.trim().toLowerCase() === "disabled") {
      iconName += `-disabled`;
    }
    if (localFile.attributes.openstatus.trim().toLowerCase() === "closed") {
      iconName += `-closed`;
    }
    return iconName;
  },

  getName(localFile: Resource<ILocalFile>): string {
    return localFile.attributes.file;
  },

  getHighlights(resource: Resource<ILocalFile>) {
    return [
      {
        key: l10n.t("Open status"),
        value: resource.attributes.openstatus,
      },
      {
        key: l10n.t("Enabled status"),
        value: resource.attributes.enablestatus,
      },
      {
        key: l10n.t("Type"),
        value: resource.attributes.vsamtype,
      },
      {
        key: l10n.t("Permission"),
        value: `${resource.attributes.browse}, ${resource.attributes.read}, ${resource.attributes.update}, 
                ${resource.attributes.add}, ${resource.attributes.delete}`,
      },
      {
        key: l10n.t("Key length"),
        value: resource.attributes.keylength,
      },
      {
        key: l10n.t("Record size"),
        value: resource.attributes.recordsize,
      },
      {
        key: l10n.t("Data set name"),
        value: resource.attributes.dsname,
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
