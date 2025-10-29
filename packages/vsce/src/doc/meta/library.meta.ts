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
import PersistentStorage from "../../utils/PersistentStorage";
import { ILibrary } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceMeta } from "./IResourceMeta";
import { LibraryDatasetMeta } from "./libraryDataset.meta";

export const LibraryMeta: IResourceMeta<ILibrary> = {
  resourceName: CicsCmciConstants.CICS_LIBRARY_RESOURCE,
  humanReadableNamePlural: "Libraries",
  humanReadableNameSingular: "Library",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_LIBRARY_RESOURCE, "library");
  },

  getLabel: function (resource: Resource<ILibrary>): string {
    let label = `${resource.attributes.name}`;

    if (resource.attributes.enablestatus.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }
    return label;
  },

  getContext: function (resource: Resource<ILibrary>): string {
    return `${CicsCmciConstants.CICS_LIBRARY_RESOURCE}.${resource.attributes.enablestatus.trim().toUpperCase()}.${resource.attributes.name}`;
  },

  getIconName: function (resource: Resource<ILibrary>): string {
    let iconName = `library`;
    if (resource.attributes.enablestatus.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(resource: Resource<ILibrary>): string {
    return resource.attributes.name;
  },

  getHighlights(resource: Resource<ILibrary>) {
    return [
      {
        key: "Ranking",
        value: resource.attributes.ranking,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_LIBRARY_RESOURCE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_LIBRARY_RESOURCE);
  },

  childType: [LibraryDatasetMeta],
};
