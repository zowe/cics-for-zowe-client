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

import { ILocalFile } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const LocalFileMeta: ResourceMeta<ILocalFile> = {

  resourceName: "CICSLocalFile",
  humanReadableName: "Local Files",
  contextPrefix: "cicstreelocalfile",
  combinedContextPrefix: "cicscombinedlocalfiletree",
  filterAttribute: "file",
  primaryKeyAttribute: "file",

  persistentStorageKey: "localFile",
  persistentStorageAllKey: "allLocalFiles",

  getDefaultFilter: function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.LOCAL_FILE_FILTER);
  },

  getLabel: function (localFile: ILocalFile): string {
    let label = `${localFile.file}`;

    if (localFile.enablestatus.trim().toLowerCase() === "disabled") {
      label += ` (Disabled)`;
    } else if (localFile.enablestatus.trim().toLowerCase() === "unenabled") {
      label += ` (Unenabled)`;
    }

    if (localFile.openstatus.trim().toLowerCase() === "closed") {
      label += ` (Closed)`;
    }

    return label;
  },

  getContext: function (localFile: ILocalFile): string {
    return `cicslocalfile.${localFile.enablestatus.trim().toLowerCase()}.${localFile.openstatus.trim().toLowerCase()}.${localFile.file}`;
  },

  getIconName: function (localFile: ILocalFile): string {
    let iconName = `local-file`;
    if (localFile.enablestatus.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    if (localFile.openstatus.trim().toUpperCase() === "CLOSED") {
      iconName += `-closed`;
    }

    return iconName;
  }
};

