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

import { ILibrary } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";

export const LibraryMeta: ResourceMeta<ILibrary> = {

  resourceName: "CICSLibrary",
  humanReadableName: "Libraries",
  contextPrefix: "cicstreelibrary",
  combinedContextPrefix: "cicscombinedlibrarytree",
  filterAttribute: "name",
  primaryKeyAttribute: "name",

  persistentStorageKey: "library",
  persistentStorageAllKey: "allLibraries",

  getDefaultFilter: function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.LIBRARY_FILTER);
  },

  getLabel: function (localFile: ILibrary): string {
    const label = `${localFile.name}`;
    return label;
  },

  getContext: function (library: ILibrary): string {
    return `cicslibrary.${library.name}`;
  },

  getIconName: function (_localFile: ILibrary): string {
    return `folder-closed`;
  }
};

