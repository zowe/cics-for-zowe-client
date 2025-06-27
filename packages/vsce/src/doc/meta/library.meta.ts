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
import { ILibrary } from "../resources";
import { IResourceMeta } from "./IResourceMeta";
import { LibraryDatasetMeta } from "./libraryDataset.meta";

const persistentStorage = new PersistentStorage("zowe.cics.persistent");

export const LibraryMeta: IResourceMeta<ILibrary> = {
  resourceName: CicsCmciConstants.CICS_LIBRARY_RESOURCE,
  humanReadableName: "Libraries",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  async getDefaultCriteria() {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_LIBRARY_RESOURCE, "library");
  },

  getLabel: function (resource: Resource<ILibrary>): string {
    let label = `${resource.attributes.name}`;

    //Adding enabled Status as it is required in e2e test cases to check if the enabled status is set or not
    if (resource.attributes.enablestatus === "disabled" || resource.attributes.enablestatus === "DISABLED") {
      label += " (Disabled)";
    }
    return label;
  },

  getContext: function (resource: Resource<ILibrary>): string {
    if (resource.attributes && resource.attributes.enablestatus) {
      return `${CicsCmciConstants.CICS_LIBRARY_RESOURCE}.${resource.attributes.enablestatus.toUpperCase()}.${resource.attributes.name}`;
    }
    // Handle the case when resource.attributes or resource.attributes.enablestatus is not defined
    return `${CicsCmciConstants.CICS_LIBRARY_RESOURCE}.${resource.attributes.name}`;
  },

  getIconName: function (resource: Resource<ILibrary>): string {
    return "library";
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
    await persistentStorage.addLibrarySearchHistory(criteria);
  },

  getCriteriaHistory() {
    return persistentStorage.getLibrarySearchHistory();
  },

  childType: LibraryDatasetMeta,
};
