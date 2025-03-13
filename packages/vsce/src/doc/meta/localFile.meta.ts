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
import { IResourceMeta } from "./IResourceMeta";
import { ILocalFile } from "../resources";

export const LocalFileMeta: IResourceMeta<ILocalFile> = {
  resourceName: CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
  humanReadableName: "Local Files",

  getDefaultFilter: function (): string {
    return "file=*";
  },

  getLabel: function (localFile: Resource<ILocalFile>): string {
    let label = `${localFile.attributes.file}`;

    if (localFile.attributes.enablestatus.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    } else if (localFile.attributes.enablestatus.trim().toLowerCase() === "unenabled") {
      label += " (Unenabled)";
    }

    if (localFile.attributes.openstatus.trim().toLowerCase() === "closed") {
      label += " (Closed)";
    }

    return label;
  },

  getContext: function (localFile: Resource<ILocalFile>): string {
    return `${CicsCmciConstants.CICS_CMCI_LOCAL_FILE
      }.${localFile.attributes.enablestatus
      }.${localFile.attributes.openstatus
      }.${localFile.attributes.file}`;
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
  }
};
